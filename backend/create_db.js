import postgres from 'postgres';

async function createDB() {
    // Connect to the default 'postgres' database just for creation
    const sql = postgres('postgresql://postgres:srimayan@1234@localhost:5432/postgres');
    
    try {
        console.log('Creating matrimony database...');
        await sql`CREATE DATABASE matrimony`;
        console.log('✅ Database created successfully!');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('✅ Database already exists!');
        } else {
            console.error('❌ Error creating database:', e.message);
        }
    } finally {
        await sql.end();
    }
}

createDB().catch(console.error);
