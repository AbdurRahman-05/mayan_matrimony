import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';
import setupDatabase from './schema.js';

dotenv.config();

const isLocal = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'));
if (!isLocal) {
    console.error('❌ You seem to be connected to NeonDB or a remote DB. Please change DATABASE_URL in .env to your local VPS PostgreSQL before importing.');
    console.error('Example: postgresql://postgres:password@localhost:5432/matrimony_db');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function importData() {
    console.log('🚀 Setting up Database Schema...');
    await setupDatabase();

    const dumpStr = fs.readFileSync('vps_database_dump.json', 'utf8');
    const dump = JSON.parse(dumpStr);

    console.log('\n📦 Starting data import to VPS DB...');

    for (const table of Object.keys(dump)) {
        const rows = dump[table];
        if (rows.length === 0) {
            console.log(`⏭️  Skipping ${table} (0 rows)`);
            continue;
        }

        try {
            console.log(`Importing ${rows.length} rows into ${table}...`);
            
            // Clear existing rows (like default admin) to avoid conflicts
            await sql`TRUNCATE TABLE ${sql(table)} CASCADE`;
            
            // For date fields that might be strings in JSON, postgres library will handle string -> date if table expects date.
            // Be careful, undefined or unsupported arrays might need handling, but JSON mostly has strings/numbers/null which is fine.
            await sql`INSERT INTO ${sql(table)} ${sql(rows)}`;
            console.log(`✅ Inserted data into ${table}`);
            
            // Fix sequence if there is an id column
            if (rows[0] && rows[0].id !== undefined) {
                await sql`SELECT setval(pg_get_serial_sequence(${table}, 'id'), coalesce(max(id),0) + 1, false) FROM ${sql(table)}`;
                console.log(`✅ Updated sequence for ${table}`);
            }
        } catch (e) {
            console.error(`❌ Error importing ${table}:`, e.message);
        }
    }

    console.log('\n🎉 Data import completed successfully! You can now start using your VPS DB.');
    process.exit(0);
}

importData().catch(console.error);
