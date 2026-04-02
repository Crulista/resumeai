/**
 * Resume Parser
 * Converts raw resume text into structured JSON
 * Works with common resume formats
 */

const SECTION_HEADERS = {
  experience: /^(work\s*experience|experience|employment|work\s*history|professional\s*experience)/i,
  education: /^(education|academic|qualifications|degrees)/i,
  skills: /^(skills|technical\s*skills|core\s*competencies|technologies|tools)/i,
  projects: /^(projects|personal\s*projects|key\s*projects|notable\s*projects)/i,
  summary: /^(summary|profile|objective|about|professional\s*summary)/i,
  certifications: /^(certifications?|licenses?|certificates?)/i,
  achievements: /^(achievements?|awards?|honors?|accomplishments?)/i,
};

function parseResume(rawText) {
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

  // Extract name (usually first non-empty line)
  if (lines.length > 0) {
    parsed.name = lines[0];
  }

  // Extract contact info from top lines
  const contactLines = lines.slice(0, 5);
  for (const line of contactLines) {
    const emailMatch = line.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) parsed.contact.email = emailMatch[0];

    const phoneMatch = line.match(/[\+]?[\d\s\-()]{10,}/);
    if (phoneMatch) parsed.contact.phone = phoneMatch[0].trim();

    const linkedinMatch = line.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) parsed.contact.linkedin = linkedinMatch[0];

    const githubMatch = line.match(/github\.com\/[\w-]+/i);
    if (githubMatch) parsed.contact.github = githubMatch[0];

    // Location patterns
    const locationMatch = line.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)/);
    if (locationMatch && !emailMatch) parsed.contact.location = locationMatch[0];
  }

  // Parse sections
  let currentSection = null;
  let currentEntry = null;
  let sectionStartIdx = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a section header
    let foundSection = null;
    for (const [section, regex] of Object.entries(SECTION_HEADERS)) {
      if (regex.test(line)) {
        foundSection = section;
        break;
      }
    }

    if (foundSection) {
      // Save previous entry if any
      if (currentEntry && currentSection === 'experience') {
        parsed.experience.push(currentEntry);
      } else if (currentEntry && currentSection === 'projects') {
        parsed.projects.push(currentEntry);
      } else if (currentEntry && currentSection === 'education') {
        parsed.education.push(currentEntry);
      }
      currentEntry = null;
      currentSection = foundSection;
      sectionStartIdx = i;
      continue;
    }

    // Process content based on current section
    if (!currentSection) continue;

    switch (currentSection) {
      case 'summary':
        parsed.summary += (parsed.summary ? ' ' : '') + line;
        break;

      case 'experience': {
        // Detect new experience entry (company line or role line)
        const isNewEntry = detectNewExperienceEntry(line, lines[i + 1]);
        
        if (isNewEntry) {
          if (currentEntry) parsed.experience.push(currentEntry);
          currentEntry = parseExperienceHeader(line, lines[i + 1] || '');
        } else if (currentEntry) {
          const bullet = cleanBullet(line);
          if (bullet) currentEntry.bullets.push(bullet);
        }
        break;
      }

      case 'projects': {
        const isNewProject = /^[A-Z]/.test(line) && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*');
        
        if (isNewProject && line.length < 100) {
          if (currentEntry) parsed.projects.push(currentEntry);
          currentEntry = { name: line.split('|')[0].trim(), description: '', bullets: [], tech: [] };
          
          // Extract tech from "| React, Node.js" pattern
          const techMatch = line.match(/\|\s*(.+)/);
          if (techMatch) {
            currentEntry.tech = techMatch[1].split(',').map(t => t.trim());
          }
        } else if (currentEntry) {
          const bullet = cleanBullet(line);
          if (bullet) currentEntry.bullets.push(bullet);
        }
        break;
      }

      case 'skills': {
        // Handle various skill formats
        const skillLine = line.replace(/^[-•*]\s*/, '');
        const colonSplit = skillLine.split(':');
        
        if (colonSplit.length === 2) {
          // "Category: skill1, skill2, skill3"
          const skills = colonSplit[1].split(/[,|;]/).map(s => s.trim()).filter(Boolean);
          parsed.skills.push(...skills);
        } else {
          const skills = skillLine.split(/[,|;]/).map(s => s.trim()).filter(Boolean);
          parsed.skills.push(...skills);
        }
        break;
      }

      case 'education': {
        const isNewEdu = /\b(university|college|institute|school|bachelor|master|mba|b\.?tech|m\.?tech|b\.?sc|m\.?sc|ph\.?d)\b/i.test(line);
        
        if (isNewEdu) {
          if (currentEntry) parsed.education.push(currentEntry);
          currentEntry = { institution: line, degree: '', year: '', details: [] };
          
          const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
          if (yearMatch) currentEntry.year = yearMatch[yearMatch.length - 1];
        } else if (currentEntry) {
          if (/\b(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|mba|ph\.?d|degree)\b/i.test(line)) {
            currentEntry.degree = line;
          } else {
            currentEntry.details.push(line);
          }
        }
        break;
      }

      case 'certifications':
      case 'achievements': {
        const item = cleanBullet(line);
        if (item) parsed[currentSection].push(item);
        break;
      }
    }
  }

  // Push last entry
  if (currentEntry) {
    if (currentSection === 'experience') parsed.experience.push(currentEntry);
    else if (currentSection === 'projects') parsed.projects.push(currentEntry);
    else if (currentSection === 'education') parsed.education.push(currentEntry);
  }

  // Deduplicate skills
  parsed.skills = [...new Set(parsed.skills.map(s => s.trim()).filter(Boolean))];

  return parsed;
}

function detectNewExperienceEntry(line, nextLine) {
  // Pattern: "Company Name" or "Role at Company" or "Role | Company"
  const hasDatePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4})\b/i;
  const hasSeparator = /[|–—-]/.test(line);
  const isShortish = line.length < 120;
  const startsCapital = /^[A-Z]/.test(line);
  const notBullet = !/^[•\-*]/.test(line);

  if (notBullet && startsCapital && isShortish) {
    if (hasDatePattern.test(line) || hasDatePattern.test(nextLine || '')) return true;
    if (hasSeparator && isShortish) return true;
  }
  return false;
}

function parseExperienceHeader(line1, line2) {
  const entry = { company: '', role: '', duration: '', location: '', bullets: [] };

  // Try to extract date ranges
  const dateRegex = /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|\d{4})/i;
  
  const dateMatch = line1.match(dateRegex) || line2.match(dateRegex);
  if (dateMatch) entry.duration = dateMatch[0];

  // Split by common separators
  const parts = line1.split(/\s*[|–—]\s*/);
  
  if (parts.length >= 2) {
    entry.role = parts[0].trim();
    entry.company = parts[1].replace(dateRegex, '').trim();
  } else {
    // Try "Role at Company" pattern
    const atMatch = line1.match(/^(.+?)\s+at\s+(.+?)(?:\s*[-–—]|$)/i);
    if (atMatch) {
      entry.role = atMatch[1].trim();
      entry.company = atMatch[2].replace(dateRegex, '').trim();
    } else {
      entry.company = line1.replace(dateRegex, '').trim();
      if (line2 && !line2.startsWith('•') && !line2.startsWith('-')) {
        entry.role = line2.replace(dateRegex, '').trim();
      }
    }
  }

  return entry;
}

function cleanBullet(line) {
  return line.replace(/^[•\-*▪▸›→⁃]\s*/, '').trim();
}

module.exports = { parseResume };
