import sql from './db.js';

async function test() {
    try {
        const query = `
            SELECT DISTINCT
                CASE
                    WHEN m.sender_id = 9 THEN m.receiver_id
                    ELSE m.sender_id
                END as other_user_id,
                (
                    SELECT content
                    FROM messages
                    WHERE (sender_id = 9 AND receiver_id = other_user_id)
                       OR (sender_id = other_user_id AND receiver_id = 9)
                    ORDER BY created_at DESC
                    LIMIT 1
                ) as last_message
            FROM messages m
        `;
        const result = await sql`${sql.unsafe(query)}`;
        console.log(result);
    } catch(e) {
        console.error("SQL Error:", e.message);
    }
    process.exit(0);
}
test();
