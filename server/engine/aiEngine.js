/**
 * AI Engine v2
 * Smarter rewriting, strict no-hallucination, space-aware
 */

const Anthropic = require('@anthropic-ai/sdk');
let client = null;

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function getAnthropicInstance() {
  return getClient();
}

/**
 * Smart resume generation - single AI call that handles:
 * - Selecting most relevant content
 * - Rewriting bullets for impact
 * - Fitting within 1 page (~400-500 words)
 * - Never inventing information
 */
async function generateTailoredResume(parsedResume, jobDescription, jobTitle, company, keywords) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null; // Fall back to rule-based
  }

  const anthropic = getClient();

  const resumeJSON = JSON.stringify(parsedResume, null, 2);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are an expert resume writer. Create a tailored 1-page resume from this candidate's data for the given job.

CANDIDATE DATA:
${resumeJSON.slice(0, 5000)}

JOB: ${jobTitle || 'the role'} at ${company || 'the company'}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CRITICAL RULES:
1. NEVER invent facts, numbers, metrics, companies, roles, or experiences not in the candidate data
2. If the original bullet has a number (%, $, users), keep it. If it doesn't, do NOT add one.
3. ONLY use information from the candidate data above
4. Select the most relevant experience and bullets for THIS specific job
5. Start each bullet with a strong past-tense action verb
6. Keep bullets concise (1 line each, under 100 chars)
7. Target 400-500 words total to fit 1 page
8. Include ALL sections that have data: summary, experience, skills, projects, education
9. For experience: pick the most relevant roles (max 3), with 3-5 bullets each based on relevance
10. For skills: only include skills relevant to this job
11. Write a 2-sentence professional summary connecting the candidate's actual background to this role

Return ONLY valid JSON (no markdown, no backticks) in this format:
{"name":"","contact":{},"summary":"","experience":[{"company":"","role":"","duration":"","bullets":[]}],"skills":[],"projects":[{"name":"","bullets":[],"tech":[]}],"education":[{"institution":"","degree":"","year":""}],"certifications":[]}`
      }],
    });

    const text = response.content[0]?.text || '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI generation failed:', err.message);
    return null;
  }
}

/**
 * Generate insights about what's missing and what could improve
 */
async function generateInsights(parsedResume, jobDescription, keywords, atsScore) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const anthropic = getClient();

  const resumeText = JSON.stringify(parsedResume).toLowerCase();
  const missingTech = keywords.technical.filter(kw => !resumeText.includes(kw));
  const matchedTech = keywords.technical.filter(kw => resumeText.includes(kw));

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Analyze this resume against the job description and give 2-3 specific, actionable suggestions.

ATS Score: ${atsScore}%
Missing technical skills from JD: ${missingTech.join(', ') || 'none'}
Matched skills: ${matchedTech.join(', ') || 'none'}

JOB DESCRIPTION (key parts):
${jobDescription.slice(0, 1500)}

RULES:
- Be specific and actionable (e.g., "Add 'project management' to your skills if you have PM experience" not "add more keywords")
- Reference the actual job requirements
- Max 3 suggestions, each 1-2 sentences
- Focus on what the candidate can actually change in their resume

Return ONLY valid JSON array (no markdown):
[{"title":"short title","tip":"specific actionable advice","severity":"high|medium|low"}]`
      }],
    });

    const text = response.content[0]?.text || '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const suggestions = JSON.parse(cleaned);

    return {
      score: atsScore,
      matchedSkills: matchedTech,
      missingSkills: missingTech,
      suggestions,
    };
  } catch (err) {
    console.error('Insights generation failed:', err.message);
    return {
      score: atsScore,
      matchedSkills: matchedTech,
      missingSkills: missingTech,
      suggestions: [],
    };
  }
}

module.exports = { generateTailoredResume, generateInsights, getAnthropicInstance };
