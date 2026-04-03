/**
 * Resume Parser v2
 * Uses AI for messy PDF text, falls back to rule-based for clean text
 */

const SECTION_HEADERS = {
  experience: /^(work\s*experience|experience|employment|work\s*history|professional\s*experience)\s*$/i,
  education: /^(education|academic|qualifications|degrees)\s*$/i,
  skills: /^(skills|technical\s*skills|core\s*competencies|technologies|tools|certifications,?\s*skills)/i,
  projects: /^(projects|personal\s*projects|key\s*projects|notable\s*projects|projects\s*&\s*extracurricular)/i,
  summary: /^(summary|profile|objective|about\s*me|professional\s*summary)\s*$/i,
  certifications: /^(certifications?\s*(and\s*training)?|licenses?|certificates?)\s*$/i,
  achievements: /^(achievements?|awards?|honors?|accomplishments?)\s*$/i,
};

// Detect if text looks like messy PDF extraction
function isMessyText(text) {
  const lines = text.split('\n');
  const shortLines = lines.filter(l => l.trim().length > 0 && l.trim().length < 15).length;
  const totalLines = lines.filter(l => l.trim().length > 0).length;
  // If >40% of lines are very short fragments, it's messy PDF text
  if (totalLines > 0 && shortLines / totalLines > 0.4) return true;
  // If lots of random spacing or no clear structure
  if (text.includes('\x00') || /  {3,}/.test(text)) return true;
  return false;
}

// AI-powered parsing for messy PDF text
async function parseResumeWithAI(rawText, anthropic) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Parse this resume text into structured JSON. The text was extracted from a PDF and may have formatting issues, merged lines, or lost bullet points.

RULES:
- Extract ONLY what is actually in the text. NEVER invent or add information.
- Each experience bullet should be a complete, separate achievement/responsibility
- If text appears merged or garbled, try to reconstruct the original meaning
- Skills should be individual items, not categories

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{"name":"","contact":{"email":"","phone":"","linkedin":"","location":""},"summary":"","experience":[{"company":"","role":"","duration":"","bullets":[]}],"education":[{"institution":"","degree":"","year":""}],"skills":[],"projects":[{"name":"","bullets":[],"tech":[]}],"certifications":[],"achievements":[]}

Resume text:
${rawText.slice(0, 6000)}`
      }],
    });

    const text = response.content[0]?.text || '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI parse failed, falling back to rule-based:', err.message);
    return null;
  }
}

// Rule-based parsing (for clean text input)
function parseResumeRuleBased(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const parsed = {
    name: '',
    contact: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  if (lines.length === 0) return parsed;

  // Name: first non-empty line that isn't a section header or contact info
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    const isSectionHeader = Object.values(SECTION_HEADERS).some(r => r.test(line));
    const isContact = /[@|•·\|]/.test(line) && line.length > 30;
    if (!isSectionHeader && !isContact && line.length > 1 && line.length < 60) {
      parsed.name = line;
      break;
    }
  }

  // Contact info from top lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const email = line.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (email) parsed.contact.email = email[0];
    const phone = line.match(/[\+]?[\d\s\-()]{10,}/);
    if (phone) parsed.contact.phone = phone[0].trim();
    const linkedin = line.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedin) parsed.contact.linkedin = linkedin[0];
    const github = line.match(/github\.com\/[\w-]+/i);
    if (github) parsed.contact.github = github[0];
    const location = line.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)/);
    if (location && !email) parsed.contact.location = location[0];
  }

  // Parse sections
  let currentSection = null;
  let currentEntry = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Check section header
    let foundSection = null;
    for (const [section, regex] of Object.entries(SECTION_HEADERS)) {
      if (regex.test(line)) { foundSection = section; break; }
    }

    if (foundSection) {
      if (currentEntry) pushEntry(parsed, currentSection, currentEntry);
      currentEntry = null;
      currentSection = foundSection;
      continue;
    }

    if (!currentSection) continue;

    const isBullet = /^[•\-\*▪▸›→⁃○◦]\s/.test(line) || /^\d+[\.\)]\s/.test(line);
    const bulletText = line.replace(/^[•\-\*▪▸›→⁃○◦]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();

    switch (currentSection) {
      case 'summary':
        parsed.summary += (parsed.summary ? ' ' : '') + line;
        break;

      case 'experience': {
        const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4})\b/i.test(line);
        const isShort = line.length < 100;
        const notBullet = !isBullet;

        if (notBullet && isShort && (hasDate || /[|–—]/.test(line)) && /[A-Z]/.test(line)) {
          if (currentEntry) pushEntry(parsed, 'experience', currentEntry);
          currentEntry = parseExpHeader(line, lines[i + 1] || '');
        } else if (isBullet && currentEntry) {
          currentEntry.bullets.push(bulletText);
        } else if (currentEntry && line.length > 20 && !hasDate) {
          // Continuation of a bullet or a new bullet without marker
          if (currentEntry.bullets.length > 0) {
            currentEntry.bullets[currentEntry.bullets.length - 1] += ' ' + line;
          } else {
            currentEntry.bullets.push(line);
          }
        }
        break;
      }

      case 'projects': {
        if (!isBullet && line.length < 100 && /^[A-Z]/.test(line)) {
          if (currentEntry) pushEntry(parsed, 'projects', currentEntry);
          const techMatch = line.match(/[|–—]\s*(.+)/);
          currentEntry = {
            name: line.split(/[|–—]/)[0].trim(),
            bullets: [],
            tech: techMatch ? techMatch[1].split(',').map(t => t.trim()) : [],
          };
        } else if (isBullet && currentEntry) {
          currentEntry.bullets.push(bulletText);
        }
        break;
      }

      case 'skills': {
        const skillLine = line.replace(/^[-•*]\s*/, '');
        const colonSplit = skillLine.split(':');
        if (colonSplit.length === 2) {
          parsed.skills.push(...colonSplit[1].split(/[,|;]/).map(s => s.trim()).filter(Boolean));
        } else {
          parsed.skills.push(...skillLine.split(/[,|;]/).map(s => s.trim()).filter(Boolean));
        }
        break;
      }

      case 'education': {
        const isEdu = /\b(university|college|institute|school|bachelor|master|mba|b\.?tech|m\.?tech|b\.?sc|m\.?sc|ph\.?d)\b/i.test(line);
        if (isEdu) {
          if (currentEntry) pushEntry(parsed, 'education', currentEntry);
          const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
          currentEntry = { institution: line.replace(/\b(19|20)\d{2}\b/g, '').replace(/[|–—]/g, '').trim(), degree: '', year: yearMatch ? yearMatch[yearMatch.length - 1] : '' };
        } else if (currentEntry) {
          if (/\b(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|mba|ph\.?d|cgpa|gpa)\b/i.test(line)) {
            currentEntry.degree = line;
          }
        }
        break;
      }

      case 'certifications':
      case 'achievements':
        if (bulletText) parsed[currentSection].push(bulletText);
        break;
    }
  }

  if (currentEntry) pushEntry(parsed, currentSection, currentEntry);
  parsed.skills = [...new Set(parsed.skills.filter(Boolean))];
  return parsed;
}

function pushEntry(parsed, section, entry) {
  if (!section || !entry) return;
  if (section === 'experience') parsed.experience.push(entry);
  else if (section === 'projects') parsed.projects.push(entry);
  else if (section === 'education') parsed.education.push(entry);
}

function parseExpHeader(line1, line2) {
  const entry = { company: '', role: '', duration: '', location: '', bullets: [] };
  const dateRegex = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|\d{4})/i;
  const dateMatch = line1.match(dateRegex) || line2.match(dateRegex);
  if (dateMatch) entry.duration = dateMatch[0];

  const parts = line1.replace(dateRegex, '').split(/\s*[|–—]\s*/);
  if (parts.length >= 2) {
    entry.role = parts[0].trim();
    entry.company = parts[1].trim();
  } else {
    const atMatch = line1.match(/^(.+?)\s+at\s+(.+?)(?:\s*[-–—]|$)/i);
    if (atMatch) { entry.role = atMatch[1].trim(); entry.company = atMatch[2].replace(dateRegex, '').trim(); }
    else { entry.company = line1.replace(dateRegex, '').trim(); }
  }
  return entry;
}

// Main parser - chooses AI or rule-based
async function parseResume(rawText, anthropic) {
  if (anthropic && isMessyText(rawText)) {
    const aiResult = await parseResumeWithAI(rawText, anthropic);
    if (aiResult) return aiResult;
  }
  return parseResumeRuleBased(rawText);
}

module.exports = { parseResume, parseResumeRuleBased, isMessyText };
