import sql from './db.js';

async function updateDb() {
    try {
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_mobile VARCHAR(20);`;
        await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(20);`;
        console.log('Columns added successfully');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}
updateDb();
