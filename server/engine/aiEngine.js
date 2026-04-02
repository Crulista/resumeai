/**
 * AI Engine - Strict no-hallucination policy
 * ONLY rewrites existing content. Never invents facts, numbers, or experiences.
 */

const Anthropic = require('@anthropic-ai/sdk');
let client = null;

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function rewriteBullets(bullets, jobContext) {
  if (!bullets || bullets.length === 0) return [];
  if (!process.env.ANTHROPIC_API_KEY) return bullets;

  const anthropic = getClient();

  const prompt = `You are an expert resume writer. Rewrite these bullet points to be more impactful.

CRITICAL RULES — NEVER VIOLATE:
1. NEVER invent new facts, numbers, metrics, or experiences that aren't in the original
2. NEVER add percentages, dollar amounts, or user counts that weren't in the original
3. If the original has a number, you may keep it. If it doesn't, do NOT add one.
4. ONLY rephrase and strengthen the language of what's already there
5. Start each bullet with a strong past-tense action verb
6. Keep each bullet to 1 line (under 120 characters ideally)
7. Match keywords from the job context where the original content genuinely relates

Job context: ${jobContext}

Original bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Return ONLY the rewritten bullets, one per line, numbered. No explanations.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '';
    const rewritten = text.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

    if (rewritten.length !== bullets.length) return bullets;
    return rewritten;
  } catch (err) {
    console.error('AI rewrite failed:', err.message);
    return bullets;
  }
}

async function generateSummary(name, topSkills, jobTitle, company) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `Experienced professional with expertise in ${topSkills.slice(0, 3).join(', ')}.`;
  }

  const anthropic = getClient();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Write a 1-2 sentence professional summary for someone named ${name} applying for ${jobTitle}${company ? ` at ${company}` : ''}.

Their key skills are: ${topSkills.join(', ')}.

RULES:
- ONLY use the skills listed above. Do NOT invent additional skills or experiences.
- Do NOT invent years of experience, specific achievements, or metrics.
- Keep it factual and concise. No fluff words like "passionate" or "dedicated".
- Return ONLY the summary text, nothing else.`
      }],
    });

    return response.content[0]?.text?.trim() || '';
  } catch (err) {
    console.error('Summary generation failed:', err.message);
    return `Experienced professional with expertise in ${topSkills.slice(0, 3).join(', ')}.`;
  }
}

module.exports = { rewriteBullets, generateSummary };
