const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { requireAuth } = require('../middleware/auth');
const { checkPaywall } = require('../middleware/paywall');
const { parseResume } = require('../engine/parser');
const { extractKeywords, scoreResume, selectTopContent } = require('../engine/ruleEngine');
const { rewriteBullets, generateSummary } = require('../engine/aiEngine');
const { buildResume, formatAsText } = require('../engine/formatter');
const { renderTemplate } = require('../engine/templates');
const pool = require('../config/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// PDF upload endpoint - extracts text from PDF
router.post('/upload-pdf', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text?.trim();

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from this PDF. Try pasting your resume as text instead.' });
    }

    res.json({ text, pageCount: data.numpages, charCount: text.length });
  } catch (err) {
    console.error('PDF parse error:', err);
    res.status(400).json({ error: 'Failed to read PDF. The file may be scanned/image-based. Try pasting as text.' });
  }
});

// Validate resume has required fields
function validateResumeFields(parsed) {
  const missing = [];
  if (!parsed.name || parsed.name.length < 2) missing.push('name');
  if (!parsed.contact.email && !parsed.contact.phone) missing.push('email or phone number');
  if (parsed.experience.length === 0 && parsed.projects.length === 0) missing.push('work experience or projects');
  if (parsed.skills.length === 0) missing.push('skills');
  return missing;
}

router.post('/', requireAuth, checkPaywall, async (req, res) => {
  const startTime = Date.now();

  try {
    const { resume, jobDescription, jobTitle, company, template } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description are required' });
    }

    if (resume.length > 20000 || jobDescription.length > 15000) {
      return res.status(400).json({ error: 'Input too long. Keep resume under 20k and JD under 15k characters.' });
    }

    // Step 1: Parse resume
    const parsedResume = parseResume(resume);

    // Step 1b: Validate required fields
    const missingFields = validateResumeFields(parsedResume);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'missing_fields',
        message: `Your resume is missing: ${missingFields.join(', ')}. Please add these before generating.`,
        missing: missingFields,
      });
    }

    // Step 2: Extract keywords from JD
    const keywords = extractKeywords(jobDescription);

    // Step 3: Score and rank
    const scoredData = scoreResume(parsedResume, keywords);

    // Step 4: Select top content — enforce 1-page by limiting bullets
    // Aim for ~450 words max (fits 1 page with standard formatting)
    const selectedContent = selectTopContent(scoredData, 3, 3); // max 3 bullets per job, max 3 jobs

    // Step 5: Collect all bullets for rewriting
    const allBullets = [];
    for (const exp of selectedContent.experience) {
      allBullets.push(...exp.topBullets);
    }

    // Step 6: AI rewrite - STRICT no hallucination
    const jobContext = `${jobTitle || 'the role'} at ${company || 'the company'}. Key skills: ${keywords.technical.slice(0, 10).join(', ')}`;
    const rewrittenBullets = await rewriteBullets(allBullets, jobContext);

    // Step 7: Summary from ACTUAL resume data only
    const summary = await generateSummary(
      parsedResume.name,
      selectedContent.skills.slice(0, 5),
      jobTitle || 'this role',
      company || ''
    );

    // Step 8: Build resume
    const finalResume = buildResume(parsedResume, selectedContent, rewrittenBullets, summary);
    const formattedText = formatAsText(finalResume);

    // Step 9: Render with selected template
    const templateId = template || 'classic';
    const formattedHTML = renderTemplate(templateId, finalResume);

    // Step 10: Build insights (what's missing from JD)
    const insights = buildInsights(parsedResume, keywords, scoredData);

    // Step 11: Decrement free uses
    if (req.isFreeUse) {
      await pool.query(
        'UPDATE users SET free_uses_remaining = GREATEST(free_uses_remaining - 1, 0) WHERE id = $1',
        [req.user.id]
      );
    }

    // Step 12: Save generation
    const genResult = await pool.query(
      'INSERT INTO generations (user_id, job_title, company, ats_score, gen_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, jobTitle, company, selectedContent.atsScore, 'resume']
    );

    await pool.query(
      'INSERT INTO generated_resumes (generation_id, user_id, content, formatted_text) VALUES ($1, $2, $3, $4)',
      [genResult.rows[0].id, req.user.id, JSON.stringify(finalResume), formattedText]
    );

    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      resume: finalResume,
      text: formattedText,
      html: formattedHTML,
      atsScore: selectedContent.atsScore,
      matchedKeywords: scoredData.matchedKeywords,
      totalKeywords: scoredData.totalKeywords,
      insights,
      generationId: genResult.rows[0].id,
      processingTimeMs: elapsed,
      freeUsesRemaining: req.isFreeUse ? req.user.free_uses_remaining - 1 : null,
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Resume generation failed. Please try again.' });
  }
});

// Build insights about what's missing
function buildInsights(parsedResume, keywords, scoredData) {
  const resumeText = JSON.stringify(parsedResume).toLowerCase();

  const missingTech = keywords.technical.filter(kw => !resumeText.includes(kw));
  const matchedTech = keywords.technical.filter(kw => resumeText.includes(kw));

  const suggestions = [];

  if (missingTech.length > 0) {
    suggestions.push({
      type: 'missing_skills',
      severity: 'high',
      title: 'Missing technical skills from JD',
      items: missingTech,
      tip: 'If you have experience with any of these, add them to your resume before generating.',
    });
  }

  const totalBullets = parsedResume.experience.flatMap(e => e.bullets).length;
  const quantified = parsedResume.experience.flatMap(e => e.bullets)
    .filter(b => /\d+%|\$[\d,]+|[\d,]+ users|\dx\b/i.test(b)).length;

  if (totalBullets > 0 && quantified / totalBullets < 0.3) {
    suggestions.push({
      type: 'quantify',
      severity: 'medium',
      title: 'Add more numbers',
      items: [`Only ${quantified} of ${totalBullets} bullets have quantified results`],
      tip: 'Add %, $, or user counts to more bullet points for stronger impact.',
    });
  }

  if (!parsedResume.summary) {
    suggestions.push({
      type: 'summary',
      severity: 'low',
      title: 'No professional summary found',
      items: [],
      tip: 'A tailored summary was generated for you, but adding one to your master resume helps.',
    });
  }

  return {
    score: scoredData.atsScore,
    matchedSkills: matchedTech,
    missingSkills: missingTech,
    suggestions,
  };
}

// History
router.get('/history', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, gr.content, gr.formatted_text
       FROM generations g
       LEFT JOIN generated_resumes gr ON gr.generation_id = g.id
       WHERE g.user_id = $1
       ORDER BY g.created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
