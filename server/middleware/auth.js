const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Require auth - block if not logged in
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Optional auth - attach user if token present, continue either way
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) req.user = result.rows[0];
    }
  } catch (_) {}
  next();
}

module.exports = { requireAuth, optionalAuth };
