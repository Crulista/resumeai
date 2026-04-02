/**
 * Setup Checker
 * Run: node checkSetup.js
 * From: the server/ directory
 *
 * Validates all env vars and tests connections before you try to run the app.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const checks = [];
let hasErrors = false;

function pass(name, detail) {
  checks.push({ name, status: '✅', detail });
}
function fail(name, detail, fix) {
  checks.push({ name, status: '❌', detail, fix });
  hasErrors = true;
}
function warn(name, detail, fix) {
  checks.push({ name, status: '⚠️', detail, fix });
}

async function run() {
  console.log('\n🔍 ResumeAI Setup Checker\n');
  console.log('Checking .env locations:');
  console.log('  ', path.resolve(__dirname, '../.env'));
  console.log('  ', path.resolve(__dirname, '.env'));
  console.log('');

  // ---- 1. Required env vars ----
  const required = {
    DATABASE_URL: 'Supabase connection string',
    GOOGLE_CLIENT_ID: 'Google OAuth Client ID',
    JWT_SECRET: 'JWT signing secret (any random string)',
    ANTHROPIC_API_KEY: 'Anthropic API key for AI rewriting',
    RAZORPAY_KEY_ID: 'Razorpay test/live key ID',
    RAZORPAY_KEY_SECRET: 'Razorpay key secret',
    RAZORPAY_PLAN_ID: 'Razorpay subscription plan ID',
  };

  const optional = {
    GOOGLE_CLIENT_SECRET: 'Google OAuth secret (not used in current flow but good to have)',
    RAZORPAY_WEBHOOK_SECRET: 'Razorpay webhook secret (needed for production)',
    CLIENT_URL: 'Frontend URL (defaults to http://localhost:5173)',
    PORT: 'Server port (defaults to 3001)',
  };

  for (const [key, desc] of Object.entries(required)) {
    const val = process.env[key];
    if (!val) {
      fail(key, `Missing — ${desc}`, `Add ${key}=... to your .env file`);
    } else if (val.includes('YOUR_') || val.includes('your_') || val.includes('[YOUR')) {
      fail(key, `Still has placeholder value`, `Replace with your actual ${desc}`);
    } else {
      // Mask the value for display
      const masked = val.length > 8 ? val.slice(0, 4) + '...' + val.slice(-4) : '****';
      pass(key, masked);
    }
  }

  for (const [key, desc] of Object.entries(optional)) {
    const val = process.env[key];
    if (!val) {
      warn(key, `Not set — ${desc}`, `Optional but recommended`);
    } else {
      const masked = val.length > 8 ? val.slice(0, 4) + '...' + val.slice(-4) : val;
      pass(key, masked);
    }
  }

  // ---- 2. Database connection test ----
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('YOUR_')) {
    console.log('\n📡 Testing database connection...');
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      const result = await pool.query('SELECT NOW() as time');
      pass('DB Connection', `Connected! Server time: ${result.rows[0].time}`);

      // Check if tables exist
      const tables = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('users', 'generations', 'resumes', 'generated_resumes')
      `);
      if (tables.rows.length === 4) {
        pass('DB Tables', 'All 4 tables exist');
      } else if (tables.rows.length === 0) {
        warn('DB Tables', 'No tables found', 'Run: node config/initDb.js');
      } else {
        warn('DB Tables', `Only ${tables.rows.length}/4 tables found`, 'Run: node config/initDb.js');
      }

      await pool.end();
    } catch (err) {
      if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        fail('DB Connection', `Cannot resolve hostname`, 
          'Check your DATABASE_URL host. If using Supabase, try the pooler URL from Settings → Database → Connection string');
      } else if (err.message.includes('password')) {
        fail('DB Connection', 'Wrong password', 
          'Check your password in DATABASE_URL. Reset it in Supabase → Settings → Database');
      } else if (err.message.includes('timeout')) {
        fail('DB Connection', 'Connection timed out', 
          'Check if your Supabase project is paused, or try port 6543 (pooler)');
      } else {
        fail('DB Connection', err.message, 'Check DATABASE_URL format');
      }
    }
  }

  // ---- 3. Anthropic API test ----
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your')) {
    console.log('📡 Testing Anthropic API...');
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      if (response.content) {
        pass('Anthropic API', 'Working!');
      }
    } catch (err) {
      if (err.status === 401) {
        fail('Anthropic API', 'Invalid API key', 'Check ANTHROPIC_API_KEY in .env');
      } else {
        fail('Anthropic API', err.message, 'Check your Anthropic API key and billing');
      }
    }
  }

  // ---- Print results ----
  console.log('\n' + '─'.repeat(60));
  console.log(' RESULTS');
  console.log('─'.repeat(60));

  for (const check of checks) {
    console.log(`  ${check.status} ${check.name}: ${check.detail}`);
    if (check.fix) console.log(`     → ${check.fix}`);
  }

  console.log('─'.repeat(60));

  if (hasErrors) {
    console.log('\n❌ Some checks failed. Fix the issues above and run this again.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed! You\'re ready to run: npm run dev\n');
  }
}

run().catch(err => {
  console.error('Checker crashed:', err);
  process.exit(1);
});
