import { config } from 'dotenv';
config();
import sql from './db.js';

async function run() {
    try {
        const cols = [
            'temporary_address TEXT',
            'permanent_address TEXT',
            'nationality VARCHAR(100)',
            'working_country VARCHAR(100)',
            'visa_status VARCHAR(100)'
        ];
        for (const c of cols) {
            console.log('Adding', c);
            try {
                await sql.unsafe(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${c}`);
                console.log('Success:', c);
            } catch (e) {
                console.log('Error adding', c, e.message);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
