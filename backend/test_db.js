import sql from './db.js';

async function test() {
    try {
        const query = `
            SELECT DISTINCT
                CASE
                    WHEN m.sender_id = 9 THEN m.receiver_id
                    ELSE m.sender_id
                END as other_user_id,
                u.unique_id,
                p.full_name,
                p.photo,
                (
                    SELECT content
                    FROM messages
                    WHERE (sender_id = 9 AND receiver_id = CASE WHEN m.sender_id = 9 THEN m.receiver_id ELSE m.sender_id END)
                       OR (sender_id = CASE WHEN m.sender_id = 9 THEN m.receiver_id ELSE m.sender_id END AND receiver_id = 9)
                    ORDER BY created_at DESC
                    LIMIT 1
                ) as last_message,
                (
                    SELECT created_at
                    FROM messages
                    WHERE (sender_id = 9 AND receiver_id = CASE WHEN m.sender_id = 9 THEN m.receiver_id ELSE m.sender_id END)
                       OR (sender_id = CASE WHEN m.sender_id = 9 THEN m.receiver_id ELSE m.sender_id END AND receiver_id = 9)
                    ORDER BY created_at DESC
                    LIMIT 1
                ) as last_message_time
            FROM messages m
            JOIN users u ON u.id = CASE
                                    WHEN m.sender_id = 9 THEN m.receiver_id
                                    ELSE m.sender_id
                                   END
            JOIN profiles p ON p.user_id = u.id
            WHERE (m.sender_id = 9 OR m.receiver_id = 9)
        `;
        const result = await sql`${sql.unsafe(query)}`;
        console.log(result);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
