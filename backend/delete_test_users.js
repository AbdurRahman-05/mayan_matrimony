import sql from './db.js';

async function deleteTestUsers() {
    try {
        console.log('Deleting test users 1 to 11...');
        const result = await sql`DELETE FROM users WHERE id BETWEEN 1 AND 11`;
        console.log(`Deleted test users successfully.`);
        process.exit(0);
    } catch (error) {
        console.error('Error deleting test users:', error);
        process.exit(1);
    }
}

deleteTestUsers();
