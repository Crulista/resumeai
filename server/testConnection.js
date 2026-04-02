const { Pool } = require('pg');

const PASSWORD = 'WY58tzyfiaseWXkp';
const PROJECT_REF = 'bgebxfxgcaenpmfzhdfm';

// Try aws-0 AND aws-1 for Seoul (ap-northeast-2)
// Supabase assigns some projects to aws-1 instead of aws-0
const urls = [
  { name: 'aws-0-ap-northeast-2 (6543)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres` },
  { name: 'aws-1-ap-northeast-2 (6543)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` },
  { name: 'aws-0-ap-northeast-2 (5432)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres` },
  { name: 'aws-1-ap-northeast-2 (5432)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres` },
  { name: 'aws-0-ap-northeast-1 (6543)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` },
  { name: 'aws-1-ap-northeast-1 (6543)', url: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres` },
  { name: 'Direct (5432)', url: `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres` },
];

async function main() {
  console.log('\nTesting connections (including aws-1 variants)...\n');
  for (const entry of urls) {
    process.stdout.write('  ' + entry.name + '... ');
    const pool = new Pool({ connectionString: entry.url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      const r = await pool.query('SELECT NOW() as time');
      await pool.end();
      console.log('CONNECTED!');
      console.log('\n  Copy this into your .env file:\n');
      console.log('  DATABASE_URL=' + entry.url + '\n');
      return;
    } catch (err) {
      const msg = err.message.split('\n')[0];
      if (msg.includes('ENOTFOUND')) console.log('DNS failed');
      else if (msg.includes('Tenant')) console.log('Wrong server');
      else if (msg.includes('password')) console.log('Wrong password');
      else console.log(msg);
      try { await pool.end(); } catch(_) {}
    }
  }
  console.log('\nAll failed. Click "Connect" button in Supabase dashboard,');
  console.log('copy the Transaction Pooler URI, and send it to me.');
}

main();
