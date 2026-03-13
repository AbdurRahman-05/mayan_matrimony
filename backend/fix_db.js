import sql from './db.js';

async function fix() {
  try {
    await sql`ALTER TABLE messages ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC'`;
    await sql`ALTER TABLE messages ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP`;
    console.log("Fixed timestamptz");
  } catch(e) { console.error(e) }
  process.exit(0);
}
fix();
