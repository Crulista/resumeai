/**
 * Make a user admin
 * Run: node makeAdmin.js user@email.com
 * From: the server/ directory
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const { Pool } = require('pg');

const email = process.argv[2];

if (!email) {
  console.log('Usage: node makeAdmin.js user@email.com');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    // First ensure column exists
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin')
        THEN ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);

    const result = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE email = $1 RETURNING id, email, name',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('   Make sure they have logged in at least once first.');
    } else {
      const user = result.rows[0];
      console.log(`✅ ${user.name || user.email} is now an admin (unlimited usage)`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
