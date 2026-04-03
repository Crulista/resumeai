const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { requireAuth } = require('../middleware/auth');
const { checkPaywall } = require('../middleware/paywall');
const { parseResume } = require('../engine/parser');
const { extractKeywords, scoreResume } = require('../engine/ruleEngine');
const { generateTailoredResume, generateInsights, getAnthropicInstance } = require('../engine/aiEngine');
const { formatAsText } = require('../engine/formatter');
const { renderTemplate } = require('../engine/templates');
const pool = require('../config/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// PDF upload
router.post('/upload-pdf', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are accepted' });
    }

    const data = await pdfParse(req.file.buffer);
    let text = data.text?.trim();

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from this PDF. Try pasting your resume as text instead.' });
    }

    // Clean up common PDF extraction artifacts
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\f/g, '\n')  // form feeds
      .replace(/\t+/g, ' ')
      .replace(/ {3,}/g, '  ')  // collapse excessive spaces
      .replace(/\n{3,}/g, '\n\n');  // collapse excessive newlines

    res.json({ text, pageCount: data.numpages, charCount: text.length });
  } catch (err) {
    console.error('PDF parse error:', err);
    res.status(400).json({ error: 'Failed to read PDF. The file may be scanned/image-based. Try pasting as text.' });
  }
});

// Main generate endpoint
router.post('/', requireAuth, checkPaywall, async (req, res) => {
  const startTime = Date.now();

  try {
    const { resume, jobDescription, jobTitle, company, template } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description are required' });
    }

    // Step 1: Parse resume (uses AI for messy PDF text)
    const anthropic = getAnthropicInstance();
    const parsedResume = await parseResume(resume, anthropic);

    // Step 2: Validate minimum fields
    const missing = [];
    if (!parsedResume.name || parsedResume.name.length < 2) missing.push('name');
    if (!parsedResume.contact?.email && !parsedResume.contact?.phone) missing.push('email or phone');
    if ((!parsedResume.experience || parsedResume.experience.length === 0) &&
        (!parsedResume.projects || parsedResume.projects.length === 0)) missing.push('work experience or projects');

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'missing_fields',
        message: `Your resume is missing: ${missing.join(', ')}. Please add these before generating.`,
        missing,
      });
    }

    // Step 3: Extract JD keywords and score
    const keywords = extractKeywords(jobDescription);
    const scoredData = scoreResume(parsedResume, keywords);

    // Step 4: AI-powered tailored resume generation
    let finalResume = await generateTailoredResume(parsedResume, jobDescription, jobTitle, company, keywords);

    // Fallback: if AI fails, use parsed resume directly
    if (!finalResume) {
      finalResume = parsedResume;
    }

    // Ensure contact info is preserved
    if (!finalResume.contact || Object.keys(finalResume.contact).length === 0) {
      finalResume.contact = parsedResume.contact;
    }
    if (!finalResume.name) finalResume.name = parsedResume.name;

    // Step 5: Format outputs
    const formattedText = formatAsText(finalResume);
    const templateId = template || 'classic';
    const formattedHTML = renderTemplate(templateId, finalResume);

    // Step 6: Generate insights
    const insights = await generateInsights(parsedResume, jobDescription, keywords, scoredData.atsScore);

    // Step 7: Decrement free uses
    if (req.isFreeUse) {
      await pool.query(
        'UPDATE users SET free_uses_remaining = GREATEST(free_uses_remaining - 1, 0) WHERE id = $1',
        [req.user.id]
      );
    }

    // Step 8: Save
    const genResult = await pool.query(
      'INSERT INTO generations (user_id, job_title, company, ats_score, gen_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, jobTitle, company, scoredData.atsScore, 'resume']
    );

    await pool.query(
      'INSERT INTO generated_resumes (generation_id, user_id, content, formatted_text) VALUES ($1, $2, $3, $4)',
      [genResult.rows[0].id, req.user.id, JSON.stringify(finalResume), formattedText]
    );

    res.json({
      success: true,
      resume: finalResume,
      text: formattedText,
      html: formattedHTML,
      atsScore: scoredData.atsScore,
      matchedKeywords: scoredData.matchedKeywords,
      totalKeywords: scoredData.totalKeywords,
      insights,
      generationId: genResult.rows[0].id,
      processingTimeMs: Date.now() - startTime,
      freeUsesRemaining: req.isFreeUse ? req.user.free_uses_remaining - 1 : null,
    });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Resume generation failed. Please try again.' });
  }
});

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
