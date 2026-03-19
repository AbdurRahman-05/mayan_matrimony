import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function verifySetup() {
    console.log('🔍 Verifying VPS Migration Setup...\n');

    // 1. Test Directory Creation
    const uploadDir = 'uploads/profiles';
    console.log(`📂 Checking directory: ${uploadDir}`);
    if (fs.existsSync(uploadDir)) {
        console.log('✅ Directory exists');
        
        // Try writing a test file
        const testFile = path.join(uploadDir, 'test_write.txt');
        try {
            fs.writeFileSync(testFile, 'Disk write test success');
            console.log('✅ Disk write permissions confirmed');
            fs.unlinkSync(testFile);
        } catch (e) {
            console.error('❌ Disk write failed:', e.message);
        }
    } else {
        console.error('❌ Directory does not exist. Run "npm start" once to create it.');
    }

    // 2. Test Database Connection
    console.log(`\n🗄️ Testing Database Connection: ${process.env.DATABASE_URL}`);
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    console.log(`Mode: ${isLocal ? 'LOCAL (VPS)' : 'REMOTE (Neon)'}`);

    try {
        const sql = postgres(process.env.DATABASE_URL);
        const result = await sql`SELECT version()`;
        console.log('✅ Database connection successful!');
        console.log('DB Version:', result[0].version);
        await sql.end();
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error.message);
        if (isLocal) {
            console.log('\n💡 Tip: Make sure PostgreSQL is running on your VPS and your .env DATABASE_URL is correct.');
        }
    }

    console.log('\n--- Verification Complete ---');
}

verifySetup().catch(console.error);
