const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { parseResume } = require('../engine/parser');
const { extractKeywords, scoreResume } = require('../engine/ruleEngine');

const router = express.Router();

router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description required' });
    }

    const parsedResume = parseResume(resume);
    const keywords = extractKeywords(jobDescription);
    const scored = scoreResume(parsedResume, keywords);

    // Build detailed breakdown
    const matchedTech = keywords.technical.filter(kw => 
      JSON.stringify(parsedResume).toLowerCase().includes(kw)
    );
    const missingTech = keywords.technical.filter(kw => 
      !JSON.stringify(parsedResume).toLowerCase().includes(kw)
    );

    const matchedGeneral = keywords.general.filter(kw =>
      JSON.stringify(parsedResume).toLowerCase().includes(kw)
    ).slice(0, 15);

    const missingGeneral = keywords.general.filter(kw =>
      !JSON.stringify(parsedResume).toLowerCase().includes(kw)
    ).slice(0, 10);

    // Suggestions
    const suggestions = [];
    
    if (missingTech.length > 0) {
      suggestions.push({
        type: 'critical',
        message: `Add missing technical skills: ${missingTech.join(', ')}`,
      });
    }

    if (!parsedResume.summary) {
      suggestions.push({
        type: 'important',
        message: 'Add a professional summary tailored to this role',
      });
    }

    const bulletsWithNumbers = parsedResume.experience
      .flatMap(e => e.bullets)
      .filter(b => /\d+%|\$[\d,]+|[\d,]+ users/i.test(b));
    
    const totalBullets = parsedResume.experience.flatMap(e => e.bullets).length;
    if (totalBullets > 0 && bulletsWithNumbers.length / totalBullets < 0.4) {
      suggestions.push({
        type: 'important',
        message: 'Quantify more achievements — only ' + 
          Math.round((bulletsWithNumbers.length / totalBullets) * 100) + 
          '% of bullets have numbers',
      });
    }

    if (parsedResume.skills.length < 5) {
      suggestions.push({
        type: 'moderate',
        message: 'Expand your skills section — ATS systems scan for keyword density',
      });
    }

    res.json({
      score: scored.atsScore,
      matchedKeywords: scored.matchedKeywords,
      totalKeywords: scored.totalKeywords,
      breakdown: {
        technical: { matched: matchedTech, missing: missingTech },
        general: { matched: matchedGeneral, missing: missingGeneral },
      },
      suggestions,
      sectionAnalysis: {
        hasName: !!parsedResume.name,
        hasContact: Object.keys(parsedResume.contact).length > 0,
        hasSummary: !!parsedResume.summary,
        experienceCount: parsedResume.experience.length,
        skillCount: parsedResume.skills.length,
        projectCount: parsedResume.projects.length,
        educationCount: parsedResume.education.length,
        totalBullets,
        quantifiedBullets: bulletsWithNumbers.length,
      },
    });
  } catch (err) {
    console.error('ATS analysis error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;
