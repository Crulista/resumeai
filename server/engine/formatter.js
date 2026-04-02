/**
 * Resume Builder / Formatter
 * Assembles final resume from processed components
 */

/**
 * Build formatted resume object
 */
function buildResume(parsedResume, selectedContent, rewrittenBullets, summary) {
  let bulletIdx = 0;

  const formattedExperience = selectedContent.experience.map(exp => {
    const bullets = exp.topBullets.map(() => {
      const bullet = rewrittenBullets[bulletIdx] || exp.topBullets[bulletIdx - (bulletIdx - exp.topBullets.indexOf(exp.topBullets[0]))];
      bulletIdx++;
      return bullet;
    });

    return {
      company: exp.company,
      role: exp.role,
      duration: exp.duration,
      location: exp.location,
      bullets,
    };
  });

  // Re-index for project bullets
  const formattedProjects = selectedContent.projects.map(proj => ({
    name: proj.name,
    tech: proj.tech || [],
    bullets: proj.topBullets, // Projects keep original bullets (less critical)
  }));

  return {
    name: parsedResume.name,
    contact: parsedResume.contact,
    summary,
    experience: formattedExperience,
    skills: selectedContent.skills,
    projects: formattedProjects,
    education: parsedResume.education,
    certifications: parsedResume.certifications,
    atsScore: selectedContent.atsScore,
  };
}

/**
 * Convert resume object to clean plain text
 */
function formatAsText(resume) {
  const lines = [];
  const divider = '─'.repeat(60);

  // Header
  lines.push(resume.name.toUpperCase());
  const contactParts = [];
  if (resume.contact.email) contactParts.push(resume.contact.email);
  if (resume.contact.phone) contactParts.push(resume.contact.phone);
  if (resume.contact.linkedin) contactParts.push(resume.contact.linkedin);
  if (resume.contact.github) contactParts.push(resume.contact.github);
  if (resume.contact.location) contactParts.push(resume.contact.location);
  if (contactParts.length) lines.push(contactParts.join(' | '));
  
  lines.push(divider);

  // Summary
  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(resume.summary);
    lines.push('');
  }

  // Experience
  if (resume.experience.length > 0) {
    lines.push('EXPERIENCE');
    lines.push(divider);
    for (const exp of resume.experience) {
      const header = [exp.role, exp.company].filter(Boolean).join(' | ');
      lines.push(header);
      if (exp.duration) lines.push(exp.duration);
      for (const bullet of exp.bullets) {
        lines.push(`  • ${bullet}`);
      }
      lines.push('');
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    lines.push('SKILLS');
    lines.push(divider);
    lines.push(resume.skills.join(' • '));
    lines.push('');
  }

  // Projects
  if (resume.projects.length > 0) {
    lines.push('PROJECTS');
    lines.push(divider);
    for (const proj of resume.projects) {
      const techStr = proj.tech?.length ? ` (${proj.tech.join(', ')})` : '';
      lines.push(`${proj.name}${techStr}`);
      for (const bullet of proj.bullets) {
        lines.push(`  • ${bullet}`);
      }
      lines.push('');
    }
  }

  // Education
  if (resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push(divider);
    for (const edu of resume.education) {
      lines.push(edu.institution);
      if (edu.degree) lines.push(edu.degree);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format as simple HTML for rendering
 */
function formatAsHTML(resume) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; font-size: 11pt; line-height: 1.4; }
  h1 { font-size: 18pt; margin: 0 0 4px 0; letter-spacing: 1px; }
  .contact { font-size: 9pt; color: #555; margin-bottom: 12px; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 2px; margin: 16px 0 8px 0; }
  .entry { margin-bottom: 10px; }
  .entry-header { font-weight: bold; }
  .entry-date { font-style: italic; color: #555; font-size: 10pt; }
  ul { margin: 4px 0; padding-left: 20px; }
  li { margin-bottom: 2px; }
  .skills { font-size: 10pt; }
  @media print { body { padding: 20px; } }
</style></head><body>`;

  html += `<h1>${esc(resume.name)}</h1>`;
  
  const contact = [];
  if (resume.contact.email) contact.push(esc(resume.contact.email));
  if (resume.contact.phone) contact.push(esc(resume.contact.phone));
  if (resume.contact.linkedin) contact.push(esc(resume.contact.linkedin));
  if (resume.contact.location) contact.push(esc(resume.contact.location));
  html += `<div class="contact">${contact.join(' | ')}</div>`;

  if (resume.summary) {
    html += `<h2>Professional Summary</h2><p>${esc(resume.summary)}</p>`;
  }

  if (resume.experience.length > 0) {
    html += `<h2>Experience</h2>`;
    for (const exp of resume.experience) {
      html += `<div class="entry">`;
      html += `<div class="entry-header">${esc(exp.role)}${exp.company ? ` | ${esc(exp.company)}` : ''}</div>`;
      if (exp.duration) html += `<div class="entry-date">${esc(exp.duration)}</div>`;
      html += `<ul>${exp.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
      html += `</div>`;
    }
  }

  if (resume.skills.length > 0) {
    html += `<h2>Skills</h2><p class="skills">${resume.skills.map(esc).join(' • ')}</p>`;
  }

  if (resume.projects.length > 0) {
    html += `<h2>Projects</h2>`;
    for (const proj of resume.projects) {
      const tech = proj.tech?.length ? ` <span style="color:#555">(${proj.tech.map(esc).join(', ')})</span>` : '';
      html += `<div class="entry"><div class="entry-header">${esc(proj.name)}${tech}</div>`;
      html += `<ul>${proj.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>`;
    }
  }

  if (resume.education.length > 0) {
    html += `<h2>Education</h2>`;
    for (const edu of resume.education) {
      html += `<div class="entry"><div class="entry-header">${esc(edu.institution)}</div>`;
      if (edu.degree) html += `<div>${esc(edu.degree)}</div>`;
      html += `</div>`;
    }
  }

  html += `</body></html>`;
  return html;
}

module.exports = { buildResume, formatAsText, formatAsHTML };
