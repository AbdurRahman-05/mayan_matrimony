import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const tables = [
    'admin_settings', 'users', 'profiles', 'profile_photos', 'preferences',
    'user_favourites', 'interests', 'shortlists', 'profile_views',
    'saved_searches', 'ignores', 'blocks', 'deactivations', 'messages'
];

async function exportData() {
    console.log('📦 Starting data export from NeonDB...');
    const dump = {};
    for (const table of tables) {
        try {
            console.log(`Exporting ${table}...`);
            const rows = await sql`SELECT * FROM ${sql(table)}`;
            dump[table] = rows;
            console.log(`✅ Extracted ${rows.length} rows from ${table}`);
        } catch (e) {
            console.error(`❌ Error exporting ${table}:`, e.message);
        }
    }

    fs.writeFileSync('vps_database_dump.json', JSON.stringify(dump, null, 2));
    console.log('\n🎉 Data exported successfully to vps_database_dump.json!');
    process.exit(0);
}

exportData().catch(console.error);
