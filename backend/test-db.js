import sql from './db.js';

async function fixTimes() {
    try {
        const users = await sql`SELECT id FROM users`;
        for (let i = 0; i < users.length; i++) {
            const randomHours = Math.floor(Math.random() * 120);
            await sql`UPDATE users SET last_seen = NOW() - interval '1 hour' * ${randomHours} WHERE id = ${users[i].id}`;
        }
        console.log('Fixed last_seen times!');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
fixTimes();
