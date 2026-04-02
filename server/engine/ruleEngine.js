/**
 * Rule Engine
 * - Extracts keywords from job descriptions
 * - Scores resume bullets against JD
 * - Selects best-matching content
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'able', 'about', 'above', 'after', 'again', 'all',
  'also', 'am', 'any', 'because', 'before', 'between', 'both', 'each',
  'few', 'get', 'got', 'he', 'her', 'here', 'him', 'his', 'how', 'i',
  'if', 'into', 'it', 'its', 'just', 'know', 'let', 'like', 'make',
  'me', 'more', 'most', 'my', 'new', 'no', 'nor', 'not', 'now', 'only',
  'other', 'our', 'out', 'own', 'said', 'same', 'she', 'so', 'some',
  'such', 'take', 'than', 'that', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'too', 'under', 'up',
  'us', 'very', 'want', 'we', 'well', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'with', 'work', 'working', 'you', 'your',
  'experience', 'role', 'position', 'looking', 'join', 'team', 'company',
  'ideal', 'candidate', 'requirements', 'responsibilities', 'qualifications',
  'preferred', 'required', 'must', 'including', 'etc', 'ability',
]);

// High-value action verbs for scoring
const ACTION_VERBS = new Set([
  'led', 'managed', 'developed', 'built', 'designed', 'implemented',
  'launched', 'grew', 'increased', 'reduced', 'optimized', 'automated',
  'architected', 'scaled', 'delivered', 'drove', 'established', 'created',
  'improved', 'achieved', 'generated', 'streamlined', 'transformed',
  'spearheaded', 'orchestrated', 'pioneered', 'mentored', 'negotiated',
]);

/**
 * Extract meaningful keywords from a job description
 */
function extractKeywords(jobDescription) {
  const text = jobDescription.toLowerCase();
  
  // Extract technical skills and tools (multi-word patterns first)
  const techPatterns = [
    /\b(?:react(?:\.js)?|next\.js|vue\.js|angular|svelte|node\.js|express\.js)\b/gi,
    /\b(?:typescript|javascript|python|java|golang|rust|ruby|php|c\+\+|c#|swift|kotlin)\b/gi,
    /\b(?:aws|gcp|azure|docker|kubernetes|terraform|ci\/cd|jenkins|github\s*actions)\b/gi,
    /\b(?:postgresql|mongodb|redis|mysql|dynamodb|elasticsearch|kafka|rabbitmq)\b/gi,
    /\b(?:rest\s*api|graphql|grpc|websocket|microservices|serverless)\b/gi,
    /\b(?:machine\s*learning|deep\s*learning|nlp|computer\s*vision|data\s*science)\b/gi,
    /\b(?:agile|scrum|kanban|jira|confluence|figma|sketch)\b/gi,
    /\b(?:product\s*management|project\s*management|stakeholder\s*management)\b/gi,
    /\b(?:a\/b\s*testing|user\s*research|data\s*analysis|sql|tableau|looker)\b/gi,
    /\b(?:saas|b2b|b2c|fintech|edtech|healthtech|e-?commerce)\b/gi,
  ];

  const technicalKeywords = new Set();
  for (const pattern of techPatterns) {
    const matches = text.match(pattern) || [];
    matches.forEach(m => technicalKeywords.add(m.toLowerCase().trim()));
  }

  // Extract single-word keywords
  const words = text
    .replace(/[^a-z0-9\s+#.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Count word frequency
  const wordFreq = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  // Sort by frequency, take top keywords
  const singleKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word);

  // Extract phrases (bigrams)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      phrases.push(phrase);
    }
  }

  const phraseFreq = {};
  for (const p of phrases) {
    phraseFreq[p] = (phraseFreq[p] || 0) + 1;
  }

  const topPhrases = Object.entries(phraseFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  return {
    technical: [...technicalKeywords],
    general: singleKeywords,
    phrases: topPhrases,
    all: [...new Set([...technicalKeywords, ...singleKeywords, ...topPhrases])],
  };
}

/**
 * Score a single bullet point against JD keywords
 */
function scoreBullet(bullet, keywords) {
  const bulletLower = bullet.toLowerCase();
  let score = 0;
  let matchedKeywords = [];

  // Technical keyword matches (highest weight)
  for (const kw of keywords.technical) {
    if (bulletLower.includes(kw)) {
      score += 3;
      matchedKeywords.push(kw);
    }
  }

  // Phrase matches
  for (const phrase of keywords.phrases) {
    if (bulletLower.includes(phrase)) {
      score += 2;
      matchedKeywords.push(phrase);
    }
  }

  // Single keyword matches
  for (const kw of keywords.general) {
    if (bulletLower.includes(kw)) {
      score += 1;
      matchedKeywords.push(kw);
    }
  }

  // Bonus for quantified impact
  if (/\d+%|\$[\d,]+|[\d,]+ users|[\d.]+ million|\dx\b/i.test(bullet)) {
    score += 2;
  }

  // Bonus for strong action verbs
  const firstWord = bulletLower.split(/\s+/)[0];
  if (ACTION_VERBS.has(firstWord)) {
    score += 1;
  }

  return { bullet, score, matchedKeywords: [...new Set(matchedKeywords)] };
}

/**
 * Score and rank all resume content against JD
 */
function scoreResume(parsedResume, keywords) {
  // Score experience bullets
  const scoredExperience = parsedResume.experience.map(exp => ({
    ...exp,
    scoredBullets: exp.bullets
      .map(b => scoreBullet(b, keywords))
      .sort((a, b) => b.score - a.score),
  }));

  // Score project bullets
  const scoredProjects = parsedResume.projects.map(proj => ({
    ...proj,
    scoredBullets: proj.bullets
      .map(b => scoreBullet(b, keywords))
      .sort((a, b) => b.score - a.score),
  }));

  // Score skills relevance
  const scoredSkills = parsedResume.skills.map(skill => {
    const skillLower = skill.toLowerCase();
    const isRelevant = keywords.all.some(kw => 
      skillLower.includes(kw) || kw.includes(skillLower)
    );
    return { skill, relevant: isRelevant };
  });

  // Calculate overall ATS score
  const allKeywords = keywords.all;
  const resumeText = JSON.stringify(parsedResume).toLowerCase();
  const matchedCount = allKeywords.filter(kw => resumeText.includes(kw)).length;
  const atsScore = Math.min(100, Math.round((matchedCount / Math.max(allKeywords.length, 1)) * 100));

  return {
    experience: scoredExperience,
    projects: scoredProjects,
    skills: scoredSkills,
    atsScore,
    matchedKeywords: matchedCount,
    totalKeywords: allKeywords.length,
  };
}

/**
 * Select the best content for a 1-page resume
 */
function selectTopContent(scoredData, maxBulletsPerJob = 4, maxJobs = 3) {
  // Select top experience entries
  const topExperience = scoredData.experience
    .map(exp => ({
      ...exp,
      topBullets: exp.scoredBullets.slice(0, maxBulletsPerJob).map(b => b.bullet),
      avgScore: exp.scoredBullets.reduce((sum, b) => sum + b.score, 0) / Math.max(exp.scoredBullets.length, 1),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, maxJobs);

  // Select top projects (max 2)
  const topProjects = scoredData.projects
    .map(proj => ({
      ...proj,
      topBullets: proj.scoredBullets.slice(0, 3).map(b => b.bullet),
      avgScore: proj.scoredBullets.reduce((sum, b) => sum + b.score, 0) / Math.max(proj.scoredBullets.length, 1),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 2);

  // Select relevant skills first, then fill with others
  const relevantSkills = scoredData.skills.filter(s => s.relevant).map(s => s.skill);
  const otherSkills = scoredData.skills.filter(s => !s.relevant).map(s => s.skill);
  const selectedSkills = [...relevantSkills, ...otherSkills].slice(0, 15);

  return {
    experience: topExperience,
    projects: topProjects,
    skills: selectedSkills,
    atsScore: scoredData.atsScore,
  };
}

module.exports = { extractKeywords, scoreBullet, scoreResume, selectTopContent };
