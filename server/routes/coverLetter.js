const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');
const { checkPaywall } = require('../middleware/paywall');
const pool = require('../config/db');

const router = express.Router();

router.post('/', requireAuth, checkPaywall, async (req, res) => {
  try {
    const { resume, jobDescription, jobTitle, company, tone } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description are required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const toneGuide = {
      professional: 'formal, polished, corporate',
      conversational: 'warm, approachable, genuine but professional',
      bold: 'confident, direct, shows strong ownership',
    }[tone || 'professional'];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Write a cover letter for the following:

ROLE: ${jobTitle || 'the position'} at ${company || 'the company'}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CANDIDATE RESUME (SUMMARY):
${resume.slice(0, 3000)}

REQUIREMENTS:
- Tone: ${toneGuide}
- Length: 3-4 paragraphs (250-350 words)
- Open with a specific hook, NOT "I am writing to express my interest"
- Connect resume achievements directly to JD requirements
- Include 1-2 specific quantified accomplishments
- Close with a confident call to action
- No generic filler

Return ONLY the cover letter text, no greeting line or sign-off formatting.`
      }],
    });

    const coverLetter = response.content[0]?.text || '';

    // Track generation (counts toward usage)
    if (req.isFreeUse) {
      await pool.query('UPDATE users SET free_used = TRUE WHERE id = $1', [req.user.id]);
    }

    await pool.query(
      'INSERT INTO generations (user_id, job_title, company, ats_score) VALUES ($1, $2, $3, $4)',
      [req.user.id, `Cover Letter: ${jobTitle}`, company, null]
    );

    res.json({
      success: true,
      coverLetter,
      wordCount: coverLetter.split(/\s+/).length,
    });
  } catch (err) {
    console.error('Cover letter generation error:', err);
    res.status(500).json({ error: 'Cover letter generation failed' });
  }
});

module.exports = router;
