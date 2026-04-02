const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initSQL = `
-- Users table (supports both Google and email/password)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  avatar_url TEXT,
  free_uses_remaining INTEGER DEFAULT 3,
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_id VARCHAR(255),
  subscription_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  job_title VARCHAR(500),
  company VARCHAR(500),
  ats_score INTEGER,
  gen_type VARCHAR(50) DEFAULT 'resume',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved resumes
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  master_resume TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated outputs
CREATE TABLE IF NOT EXISTS generated_resumes (
  id SERIAL PRIMARY KEY,
  generation_id INTEGER REFERENCES generations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content JSONB,
  formatted_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add free_uses_remaining if table exists but column doesn't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'free_uses_remaining')
  THEN
    ALTER TABLE users ADD COLUMN free_uses_remaining INTEGER DEFAULT 3;
    -- Migrate old free_used boolean to new system
    UPDATE users SET free_uses_remaining = 0 WHERE free_used = TRUE;
  END IF;
END $$;

-- Migration: add password_hash if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash')
  THEN
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_user ON generated_resumes(user_id);
`;

async function init() {
  console.log('🔍 Connecting to database...');
  console.log('   Host:', (process.env.DATABASE_URL || '').match(/@([^:\/]+)/)?.[1] || 'unknown');
  try {
    await pool.query(initSQL);
    console.log('✅ Database initialized successfully!');
    console.log('   Tables created: users, generations, resumes, generated_resumes');
  } catch (err) {
    console.error('❌ Database init failed:', err.message);
  } finally {
    await pool.end();
  }
}

init();
