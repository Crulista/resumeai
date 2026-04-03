/**
 * Resume Templates v3
 * - NO print headers/footers/URLs/page numbers
 * - Strict 1-page via @page and overflow
 * - Professional formatting based on real resume examples
 */

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shared CSS that removes ALL print artifacts
const BASE_PRINT = `
@page {
  margin: 0.4in 0.5in;
  size: letter;
}
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* Hide ALL browser print headers/footers */
  @page { margin: 0.4in 0.5in; }
  body { max-height: 10.2in; overflow: hidden; }
  .no-print { display: none !important; }
}
`;

// Helper to build experience section HTML
function expHTML(experience, opts = {}) {
  if (!experience?.length) return '';
  return experience.map(e => {
    const bullets = (e.bullets || []).filter(Boolean);
    return `<div class="entry">
<div class="entry-row"><span class="entry-left">${esc(e.role || e.company)}</span><span class="entry-right">${esc(e.duration)}</span></div>
${e.role && e.company ? `<div class="entry-sub">${esc(e.company)}${e.location ? ' | ' + esc(e.location) : ''}</div>` : ''}
${bullets.length ? `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
</div>`;
  }).join('');
}

function projHTML(projects) {
  if (!projects?.length) return '';
  return projects.map(p => {
    const bullets = (p.bullets || []).filter(Boolean);
    return `<div class="entry">
<div class="entry-left">${esc(p.name)}${p.tech?.length ? ` <span style="font-weight:400;font-size:9pt;color:#555">| ${p.tech.map(esc).join(', ')}</span>` : ''}</div>
${bullets.length ? `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
</div>`;
  }).join('');
}

function eduHTML(education) {
  if (!education?.length) return '';
  return education.map(e => `<div class="entry">
<div class="entry-row"><span class="entry-left">${esc(e.institution)}</span><span class="entry-right">${esc(e.year)}</span></div>
${e.degree ? `<div class="entry-sub">${esc(e.degree)}</div>` : ''}
</div>`).join('');
}

/**
 * Classic — Based on Jake's Resume / standard ATS-friendly format
 */
function classicHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(r.name)} - Resume</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Georgia,serif;max-width:8.5in;margin:0 auto;padding:0.45in 0.55in;color:#000;font-size:10pt;line-height:1.35}
h1{font-size:20pt;font-weight:700;text-align:center;margin-bottom:2px}
.contact{text-align:center;font-size:9pt;color:#333;margin-bottom:10px}
.section{margin-top:7px}
.section-title{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1.5px solid #000;padding-bottom:1px;margin-bottom:5px}
.entry{margin-bottom:5px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline}
.entry-left{font-weight:700;font-size:10pt}
.entry-right{font-size:9pt;font-style:italic;white-space:nowrap;color:#444}
.entry-sub{font-style:italic;font-size:9.5pt;color:#333}
ul{margin:1px 0 0;padding-left:14px}
li{margin-bottom:1px;font-size:9.5pt}
${BASE_PRINT}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin, r.contact?.github, r.contact?.location].filter(Boolean).map(esc).join(' &nbsp;|&nbsp; ')}</div>
${r.summary ? `<div class="section"><div class="section-title">Summary</div><p style="font-size:9.5pt;margin-top:2px">${esc(r.summary)}</p></div>` : ''}
${r.experience?.length ? `<div class="section"><div class="section-title">Experience</div>${expHTML(r.experience)}</div>` : ''}
${r.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${projHTML(r.projects)}</div>` : ''}
${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div><div style="font-size:9.5pt">${r.skills.map(esc).join(', ')}</div></div>` : ''}
${r.education?.length ? `<div class="section"><div class="section-title">Education</div>${eduHTML(r.education)}</div>` : ''}
${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div><div style="font-size:9.5pt">${r.certifications.map(esc).join(' • ')}</div></div>` : ''}
</body></html>`;
}

/**
 * Professional — Blue accents, modern sans-serif
 */
function professionalHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(r.name)} - Resume</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;max-width:8.5in;margin:0 auto;padding:0.45in 0.55in;color:#1a1a1a;font-size:10pt;line-height:1.4}
h1{font-size:22pt;font-weight:300;color:#1a1a1a;margin-bottom:2px;letter-spacing:-0.3px}
.contact{font-size:8.5pt;color:#666;margin-bottom:12px}
.section{margin-top:9px}
.section-title{font-size:12pt;font-weight:400;color:#2563eb;border-bottom:2px solid #dbeafe;padding-bottom:2px;margin-bottom:6px}
.entry{margin-bottom:7px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline}
.entry-left{font-weight:600;font-size:10pt}
.entry-right{font-size:9pt;color:#888}
.entry-sub{font-size:9pt;color:#555;margin-bottom:1px}
ul{margin:1px 0 0;padding-left:15px}
li{margin-bottom:1px;font-size:9.5pt;color:#333}
${BASE_PRINT}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.location, r.contact?.linkedin].filter(Boolean).map(esc).join(' &nbsp;| &nbsp;')}</div>
${r.summary ? `<div class="section"><div class="section-title">Summary</div><p style="font-size:9.5pt;color:#333">${esc(r.summary)}</p></div>` : ''}
${r.experience?.length ? `<div class="section"><div class="section-title">Experience</div>${expHTML(r.experience)}</div>` : ''}
${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div><div style="font-size:9.5pt">${r.skills.map(esc).join(', ')}</div></div>` : ''}
${r.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${projHTML(r.projects)}</div>` : ''}
${r.education?.length ? `<div class="section"><div class="section-title">Education</div>${eduHTML(r.education)}</div>` : ''}
${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div><div style="font-size:9.5pt">${r.certifications.map(esc).join(' • ')}</div></div>` : ''}
</body></html>`;
}

/**
 * Minimal — Ultra clean, dash bullets, pill skills
 */
function minimalHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(r.name)} - Resume</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;max-width:8.5in;margin:0 auto;padding:0.5in 0.6in;color:#111;font-size:9.5pt;line-height:1.5}
h1{font-size:24pt;font-weight:300;letter-spacing:-0.5px;margin-bottom:3px}
.contact{font-size:8.5pt;color:#999;letter-spacing:0.3px;margin-bottom:16px}
.section{margin-top:12px}
.section-title{font-size:8pt;text-transform:uppercase;letter-spacing:3px;color:#999;font-weight:500;margin-bottom:6px}
.entry{margin-bottom:8px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline}
.entry-left{font-weight:500;font-size:10pt}
.entry-right{font-size:8.5pt;color:#aaa}
.entry-sub{font-size:8.5pt;color:#888}
ul{margin:2px 0 0;padding-left:0;list-style:none}
li{position:relative;padding-left:12px;margin-bottom:1px;font-size:9pt;color:#444}
li:before{content:'–';position:absolute;left:0;color:#ccc}
.skills-wrap{display:flex;flex-wrap:wrap;gap:4px}
.skill{font-size:8pt;color:#666;padding:2px 8px;border:1px solid #e0e0e0;border-radius:100px}
${BASE_PRINT}
</style></head><body>
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin].filter(Boolean).map(esc).join(' / ')}</div>
${r.summary ? `<p style="font-size:9.5pt;color:#555;margin-bottom:12px">${esc(r.summary)}</p>` : ''}
${r.experience?.length ? `<div class="section"><div class="section-title">Experience</div>${r.experience.map(e => `<div class="entry"><div class="entry-row"><span class="entry-left">${esc(e.role)} <span style="font-weight:300;color:#888">@ ${esc(e.company)}</span></span><span class="entry-right">${esc(e.duration)}</span></div><ul>${(e.bullets||[]).filter(Boolean).map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}
${r.skills?.length ? `<div class="section"><div class="section-title">Skills</div><div class="skills-wrap">${r.skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div></div>` : ''}
${r.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${projHTML(r.projects)}</div>` : ''}
${r.education?.length ? `<div class="section"><div class="section-title">Education</div>${eduHTML(r.education)}</div>` : ''}
</body></html>`;
}

/**
 * Executive — Serif, centered, double border, for senior roles
 */
function executiveHTML(r) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(r.name)} - Resume</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;max-width:8.5in;margin:0 auto;padding:0.45in 0.55in;color:#1a1a1a;font-size:10pt;line-height:1.4}
.header{text-align:center;border-bottom:3px double #1a1a1a;padding-bottom:8px;margin-bottom:10px}
h1{font-size:20pt;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px}
.contact{font-size:8.5pt;color:#555;letter-spacing:0.5px}
.section{margin-top:9px}
.section-title{font-size:10pt;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ccc;padding-bottom:2px;margin-bottom:5px}
.entry{margin-bottom:7px}
.entry-row{display:flex;justify-content:space-between;align-items:baseline}
.entry-left{font-weight:700;font-size:10pt}
.entry-right{font-style:italic;font-size:9pt;color:#666}
.entry-sub{font-size:9pt;color:#444;margin-bottom:1px}
ul{margin:1px 0 0;padding-left:15px}
li{margin-bottom:1px;font-size:9.5pt}
${BASE_PRINT}
</style></head><body>
<div class="header">
<h1>${esc(r.name)}</h1>
<div class="contact">${[r.contact?.email, r.contact?.phone, r.contact?.linkedin, r.contact?.location].filter(Boolean).map(esc).join(' &middot; ')}</div>
</div>
${r.summary ? `<div class="section"><div class="section-title">Executive Summary</div><p style="font-style:italic;color:#333;font-size:9.5pt">${esc(r.summary)}</p></div>` : ''}
${r.experience?.length ? `<div class="section"><div class="section-title">Professional Experience</div>${expHTML(r.experience)}</div>` : ''}
${r.skills?.length ? `<div class="section"><div class="section-title">Core Competencies</div><div style="font-size:9.5pt">${r.skills.map(esc).join(' &middot; ')}</div></div>` : ''}
${r.education?.length ? `<div class="section"><div class="section-title">Education</div>${eduHTML(r.education)}</div>` : ''}
${r.certifications?.length ? `<div class="section"><div class="section-title">Certifications</div><div style="font-size:9.5pt">${r.certifications.map(esc).join(' • ')}</div></div>` : ''}
</body></html>`;
}

const templates = {
  classic: { name: 'Classic', description: 'ATS-friendly single column with rules.', generateHTML: classicHTML },
  professional: { name: 'Professional', description: 'Modern with blue accents.', generateHTML: professionalHTML },
  minimal: { name: 'Minimal', description: 'Ultra-clean, tech & design roles.', generateHTML: minimalHTML },
  executive: { name: 'Executive', description: 'Serif, centered. Senior roles.', generateHTML: executiveHTML },
};

function getTemplateList() {
  return Object.entries(templates).map(([id, t]) => ({ id, name: t.name, description: t.description }));
}

function renderTemplate(templateId, resume) {
  const t = templates[templateId] || templates.classic;
  return t.generateHTML(resume);
}

module.exports = { getTemplateList, renderTemplate, templates };
