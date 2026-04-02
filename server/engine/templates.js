/**
 * Resume Templates — Based on professional resume formats
 * ALL templates enforce 1-page via CSS max-height + overflow hidden on print
 */

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shared print CSS that enforces 1 page
const PRINT_CSS = `
@media print {
  html, body { margin: 0; padding: 0; }
  body { max-height: 100vh; overflow: hidden; }
  .no-print { display: none !important; }
}
@page { margin: 0.4in 0.5in; size: letter; }
`;

/**
 * Classic — Clean single column, horizontal rules, similar to Jake's Resume format
 * Education-first for students, Experience-first for professionals
 */
function classicHTML(r) {
  const hasExp = r.experience?.length > 0;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Georgia,serif;max-width:8.5in;margin:0 auto;padding:0.5in 0.6in;color:#000;font-size:10pt;line-height:1.35}
h1{font-size:22pt;font-weight:700;text-align:center;margin-bottom:2px}
.subtitle{text-align:center;font-size:10pt;color:#333;margin-bottom:8px}
.contact{text-align:center;font-size:9pt;margin-bottom:10px}
.contact a{color:#000;text-decoration:underline}
.section{margin-top:8px}
.section-title{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1.5px solid #000;padding-bottom:1px;margin-bottom:6px}
.entry{margin-bottom:6px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline}
.entry-left{font-weight:700;font-size:10pt}
.entry-right{font-size:9pt;font-style:italic;white-space:nowrap}
.entry-sub{display:flex;justify-content:space-between;font-style:italic;font-size:9.5pt;color:#333}
ul{margin:2px 0 0;padding-left:15px}
li{margin-bottom:1px;font-size:9.5pt}
.skills-line{font-size:9.5pt;margin-bottom:2px}
.skills-line b{font-weight:700}
${PRINT_CSS}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin, r.contact?.github, r.contact?.location].filter(Boolean).map(esc).join(' &nbsp;|&nbsp; ')}</div>

${r.summary ? `<div class="section"><div class="section-title">Summary</div><p style="font-size:9.5pt">${esc(r.summary)}</p></div>` : ''}

${hasExp ? `<div class="section"><div class="section-title">Experience</div>
${r.experience.map(e => `<div class="entry">
<div class="entry-row"><span class="entry-left">${esc(e.company)}</span><span class="entry-right">${esc(e.duration)}</span></div>
<div class="entry-sub"><span>${esc(e.role)}</span>${e.location ? `<span>${esc(e.location)}</span>` : ''}</div>
<ul>${(e.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div>`).join('')}</div>` : ''}

${r.projects?.length ? `<div class="section"><div class="section-title">Projects</div>
${r.projects.map(p => `<div class="entry">
<div class="entry-row"><span class="entry-left">${esc(p.name)}${p.tech?.length ? ` <span style="font-weight:400;font-size:9pt">| ${p.tech.map(esc).join(', ')}</span>` : ''}</span></div>
<ul>${(p.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div>`).join('')}</div>` : ''}

${r.education?.length ? `<div class="section"><div class="section-title">Education</div>
${r.education.map(e => `<div class="entry">
<div class="entry-row"><span class="entry-left">${esc(e.institution)}</span><span class="entry-right">${esc(e.year)}</span></div>
${e.degree ? `<div style="font-style:italic;font-size:9.5pt">${esc(e.degree)}</div>` : ''}
</div>`).join('')}</div>` : ''}

${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div>
<div class="skills-line">${r.skills.map(esc).join(', ')}</div>
</div>` : ''}

${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div>
${r.certifications.map(c => `<div style="font-size:9.5pt;margin-bottom:1px">• ${esc(c)}</div>`).join('')}</div>` : ''}
</body></html>`;
}

/**
 * Professional — Based on Rohan Malhotra format (beige accents, clean sections)
 */
function professionalHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:8.5in;margin:0 auto;padding:0.45in 0.55in;color:#1a1a1a;font-size:10pt;line-height:1.4}
h1{font-size:24pt;font-weight:300;color:#1a1a1a;margin-bottom:2px;letter-spacing:-0.5px}
.tagline{font-size:10pt;color:#555;margin-bottom:4px}
.contact{font-size:8.5pt;color:#666;margin-bottom:12px}
.section{margin-top:10px}
.section-title{font-size:13pt;font-weight:400;color:#2a6496;border-bottom:2px solid #e8e0d0;padding-bottom:3px;margin-bottom:8px}
.entry{margin-bottom:8px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline}
.entry-title{font-weight:700;font-size:10pt}
.entry-date{font-size:9pt;color:#888}
.entry-company{font-size:9pt;color:#555;margin-bottom:2px}
ul{margin:2px 0 0;padding-left:16px}
li{margin-bottom:2px;font-size:9.5pt;color:#333}
.skills-section{font-size:9.5pt}
.skills-section div{margin-bottom:2px}
.skills-section b{color:#1a1a1a}
${PRINT_CSS}
</style></head><body>
<h1>${esc(r.name)}</h1>
${r.experience?.[0]?.role ? `<div class="tagline">${esc(r.experience[0].role)}</div>` : ''}
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin].filter(Boolean).map(esc).join(' &nbsp;| &nbsp;')}</div>

${r.summary ? `<div class="section"><div class="section-title">Summary</div><p style="font-size:9.5pt;color:#333;line-height:1.5">${esc(r.summary)}</p></div>` : ''}

${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div>
<div class="skills-section"><div>${r.skills.map(esc).join(', ')}</div></div></div>` : ''}

${r.experience?.length ? `<div class="section"><div class="section-title">Work Experience</div>
${r.experience.map(e => `<div class="entry">
<div class="entry-header"><span class="entry-title">${esc(e.role)}</span><span class="entry-date">${esc(e.duration)}</span></div>
<div class="entry-company">${esc(e.company)}${e.location ? ' | ' + esc(e.location) : ''}</div>
<ul>${(e.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div>`).join('')}</div>` : ''}

${r.education?.length ? `<div class="section"><div class="section-title">Education</div>
${r.education.map(e => `<div class="entry">
<div class="entry-header"><span class="entry-title">${e.degree ? esc(e.degree) : esc(e.institution)}</span><span class="entry-date">${esc(e.year)}</span></div>
${e.degree ? `<div class="entry-company">${esc(e.institution)}</div>` : ''}
</div>`).join('')}</div>` : ''}

${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div>
<ul>${r.certifications.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
</body></html>`;
}

/**
 * Minimal — Ultra-clean, lots of whitespace, dash bullets, pill skills
 */
function minimalHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue','SF Pro Text',Arial,sans-serif;max-width:8.5in;margin:0 auto;padding:0.5in 0.65in;color:#111;font-size:9.5pt;line-height:1.5}
h1{font-size:26pt;font-weight:300;letter-spacing:-0.5px;margin-bottom:4px}
.contact{font-size:8.5pt;color:#999;letter-spacing:0.3px;margin-bottom:20px}
.section{margin-top:14px}
.section-title{font-size:8pt;text-transform:uppercase;letter-spacing:3px;color:#999;font-weight:500;margin-bottom:8px}
.entry{margin-bottom:10px}
.entry-title{font-weight:500;font-size:10pt}
.entry-at{font-weight:300;color:#888}
.entry-date{font-size:8.5pt;color:#aaa}
ul{margin:3px 0 0;padding-left:0;list-style:none}
li{position:relative;padding-left:12px;margin-bottom:2px;font-size:9pt;color:#444}
li:before{content:'–';position:absolute;left:0;color:#ccc}
.skills-wrap{display:flex;flex-wrap:wrap;gap:5px}
.skill{font-size:8pt;color:#666;padding:2px 10px;border:1px solid #e0e0e0;border-radius:100px}
${PRINT_CSS}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin].filter(Boolean).map(esc).join(' / ')}</div>

${r.summary ? `<p style="font-size:9.5pt;color:#555;max-width:90%;margin-bottom:16px">${esc(r.summary)}</p>` : ''}

${r.experience?.length ? `<div class="section"><div class="section-title">Experience</div>
${r.experience.map(e => `<div class="entry">
<div class="entry-title">${esc(e.role)} <span class="entry-at">@ ${esc(e.company)}</span></div>
<div class="entry-date">${esc(e.duration)}</div>
<ul>${(e.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div>`).join('')}</div>` : ''}

${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div>
<div class="skills-wrap">${r.skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div></div>` : ''}

${r.projects?.length ? `<div class="section"><div class="section-title">Projects</div>
${r.projects.map(p => `<div class="entry"><div class="entry-title">${esc(p.name)}</div>
<ul>${(p.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}

${r.education?.length ? `<div class="section"><div class="section-title">Education</div>
${r.education.map(e => `<div class="entry"><div class="entry-title">${esc(e.institution)}</div>
${e.degree ? `<div class="entry-date">${esc(e.degree)}</div>` : ''}</div>`).join('')}</div>` : ''}
</body></html>`;
}

/**
 * Executive — Bold header, serif, centered name, double border — for senior roles
 */
function executiveHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;max-width:8.5in;margin:0 auto;padding:0.45in 0.6in;color:#1a1a1a;font-size:10pt;line-height:1.4}
.header{text-align:center;border-bottom:3px double #1a1a1a;padding-bottom:10px;margin-bottom:10px}
h1{font-size:22pt;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px}
.contact{font-size:8.5pt;color:#555;letter-spacing:0.5px}
.section{margin-top:10px}
.section-title{font-size:10pt;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ccc;padding-bottom:2px;margin-bottom:6px}
.entry{margin-bottom:8px}
.entry-header{display:flex;justify-content:space-between;align-items:baseline}
.entry-title{font-weight:700;font-size:10.5pt}
.entry-date{font-style:italic;font-size:9pt;color:#666}
.entry-sub{font-size:9.5pt;color:#444;margin-bottom:2px}
ul{margin:2px 0 0;padding-left:16px}
li{margin-bottom:2px;font-size:9.5pt}
${PRINT_CSS}
</style></head><body>
<div class="header">
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin, r.contact?.location].filter(Boolean).map(esc).join(' &middot; ')}</div>
</div>

${r.summary ? `<div class="section"><div class="section-title">Executive Summary</div>
<p style="font-style:italic;color:#333;font-size:9.5pt;line-height:1.5">${esc(r.summary)}</p></div>` : ''}

${r.experience?.length ? `<div class="section"><div class="section-title">Professional Experience</div>
${r.experience.map(e => `<div class="entry">
<div class="entry-header"><span class="entry-title">${esc(e.role)}</span><span class="entry-date">${esc(e.duration)}</span></div>
<div class="entry-sub">${esc(e.company)}</div>
<ul>${(e.bullets||[]).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
</div>`).join('')}</div>` : ''}

${r.skills?.length ? `<div class="section"><div class="section-title">Core Competencies</div>
<p style="font-size:9.5pt">${r.skills.map(esc).join(' &middot; ')}</p></div>` : ''}

${r.education?.length ? `<div class="section"><div class="section-title">Education</div>
${r.education.map(e => `<div class="entry">
<div class="entry-header"><span class="entry-title">${esc(e.institution)}</span><span class="entry-date">${esc(e.year)}</span></div>
${e.degree ? `<div class="entry-sub">${esc(e.degree)}</div>` : ''}</div>`).join('')}</div>` : ''}

${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div>
${r.certifications.map(c => `<div style="font-size:9.5pt;margin-bottom:2px">${esc(c)}</div>`).join('')}</div>` : ''}
</body></html>`;
}

const templates = {
  classic: { name: 'Classic', description: 'Clean single-column with horizontal rules. Works everywhere.', generateHTML: classicHTML },
  professional: { name: 'Professional', description: 'Modern with blue accents and structured sections.', generateHTML: professionalHTML },
  minimal: { name: 'Minimal', description: 'Ultra-clean with max whitespace. Tech & design roles.', generateHTML: minimalHTML },
  executive: { name: 'Executive', description: 'Bold serif with centered header. Senior roles.', generateHTML: executiveHTML },
};

function getTemplateList() {
  return Object.entries(templates).map(([id, t]) => ({ id, name: t.name, description: t.description }));
}

function renderTemplate(templateId, resume) {
  const t = templates[templateId] || templates.classic;
  return t.generateHTML(resume);
}

module.exports = { getTemplateList, renderTemplate, templates };
