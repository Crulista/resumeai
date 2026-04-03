require('dotenv').config({ path: '../.env' });
require('dotenv').config(); // Also check current dir for production

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const paymentRoutes = require('./routes/payment');
const coverLetterRoutes = require('./routes/coverLetter');
const atsRoutes = require('./routes/atsScore');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (required for Render, Railway, etc behind reverse proxy)
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests, slow down.' },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3, // 3 generations per minute
  message: { error: 'Generation limit reached. Wait a minute.' },
});

app.use(generalLimiter);

// Body parsing (webhook needs raw body)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '5mb' }));

// Logging
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateLimiter, generateRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cover-letter', generateLimiter, coverLetterRoutes);
app.use('/api/ats', atsRoutes);

// Templates API
const { getTemplateList, renderTemplate } = require('./engine/templates');
app.get('/api/templates', (req, res) => res.json(getTemplateList()));
app.post('/api/templates/render', express.json(), (req, res) => {
  const { templateId, resume } = req.body;
  if (!resume) return res.status(400).json({ error: 'Resume data required' });
  const html = renderTemplate(templateId || 'classic', resume);
  res.json({ html });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ResumeAI server running on port ${PORT}`);
});

module.exports = app;
