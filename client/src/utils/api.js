const API_BASE = '/api';

function getToken() { return localStorage.getItem('resumeai_token'); }
function setToken(t) { localStorage.setItem('resumeai_token', t); }
function clearToken() { localStorage.removeItem('resumeai_token'); }
export function isLoggedIn() { return !!getToken(); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) { const err = new Error(data.error || 'Request failed'); err.status = res.status; err.data = data; throw err; }
  return data;
}

// Auth - email
export async function signup({ email, password, name }) {
  const data = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });
  setToken(data.token); return data;
}
export async function login({ email, password }) {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token); return data;
}
// Auth - google
export async function loginWithGoogle(credential) {
  const data = await request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
  setToken(data.token); return data;
}
export async function getMe() { return request('/auth/me'); }
export function logout() { clearToken(); }

// Generate
export async function generateResume({ resume, jobDescription, jobTitle, company, template }) {
  return request('/generate', { method: 'POST', body: JSON.stringify({ resume, jobDescription, jobTitle, company, template }) });
}
export async function uploadPDF(file) {
  const form = new FormData();
  form.append('resume', file);
  return request('/generate/upload-pdf', { method: 'POST', body: form });
}
export async function getHistory() { return request('/generate/history'); }

// Payment
export async function createSubscription(planId) {
  return request('/payment/create-subscription', { method: 'POST', body: JSON.stringify({ planId }) });
}
export async function getPaymentStatus() { return request('/payment/status'); }
export async function cancelSubscription() { return request('/payment/cancel', { method: 'POST' }); }

// Cover letter
export async function generateCoverLetter({ resume, jobDescription, jobTitle, company, tone }) {
  return request('/cover-letter', { method: 'POST', body: JSON.stringify({ resume, jobDescription, jobTitle, company, tone }) });
}

// ATS
export async function analyzeATS({ resume, jobDescription }) {
  return request('/ats/analyze', { method: 'POST', body: JSON.stringify({ resume, jobDescription }) });
}

// Templates
export async function getTemplates() { return request('/templates'); }
export async function renderTemplateAPI({ templateId, resume }) {
  return request('/templates/render', { method: 'POST', body: JSON.stringify({ templateId, resume }) });
}

export { getToken, setToken, clearToken };
