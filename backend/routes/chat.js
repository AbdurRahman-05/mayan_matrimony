import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Get list of users the current user is chatting with
router.get('/chat-list', auth, async (req, res) => {
    try {
        const query = `
            WITH RecentMessages AS (
                SELECT DISTINCT ON (
                    CASE WHEN sender_id = ${req.user.id} THEN receiver_id ELSE sender_id END
                )
                    CASE WHEN sender_id = ${req.user.id} THEN receiver_id ELSE sender_id END as other_user_id,
                    content as last_message,
                    created_at as last_message_time
                FROM messages
                WHERE (sender_id = ${req.user.id} OR receiver_id = ${req.user.id})
                ORDER BY 
                    CASE WHEN sender_id = ${req.user.id} THEN receiver_id ELSE sender_id END,
                    created_at DESC
            )
            SELECT 
                rm.other_user_id,
                u.unique_id,
                p.full_name,
                p.photo,
                rm.last_message,
                rm.last_message_time
            FROM RecentMessages rm
            JOIN users u ON u.id = rm.other_user_id
            JOIN profiles p ON p.user_id = rm.other_user_id
            WHERE NOT EXISTS (
                SELECT 1 FROM ignores i
                WHERE (i.user_id = ${req.user.id} AND i.ignored_user_id = rm.other_user_id)
                   OR (i.user_id = rm.other_user_id AND i.ignored_user_id = ${req.user.id})
            )
            ORDER BY rm.last_message_time DESC
        `;

        const results = await sql`${sql.unsafe(query)}`;
        res.json(results);
    } catch (error) {
        return dbErrorResponse(res, 'Get chat list error', error, 'Failed to fetch chat list.');
    }
});

// Get total unread senders count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const query = `
            SELECT COUNT(DISTINCT sender_id) as unread_count
            FROM messages
            WHERE receiver_id = ${req.user.id} AND is_read = false
        `;
        const result = await sql`${sql.unsafe(query)}`;
        res.json({ unreadCount: parseInt(result[0].unread_count || 0, 10) });
    } catch (error) {
        return dbErrorResponse(res, 'Get unread count error', error, 'Failed to fetch unread count.');
    }
});

// Get messages for a specific conversation
router.get('/:uniqueId', auth, async (req, res) => {
    try {
        const receiver = await sql`SELECT id, unique_id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (receiver.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const otherUserId = receiver[0].id;
        
        // Let's also verify they haven't ignored each other
        const isIgnored = await sql`
            SELECT 1 FROM ignores
            WHERE (user_id = ${req.user.id} AND ignored_user_id = ${otherUserId})
               OR (user_id = ${otherUserId} AND ignored_user_id = ${req.user.id})
        `;

        if (isIgnored.length > 0) {
             return res.status(403).json({ error: 'Users cannot chat.' });
        }


        // Mark unread messages as read
        await sql`
            UPDATE messages
            SET is_read = true
            WHERE receiver_id = ${req.user.id} AND sender_id = ${otherUserId} AND is_read = false
        `;

        const messages = await sql`
            SELECT m.*, u.unique_id as sender_unique_id
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ${req.user.id} AND m.receiver_id = ${otherUserId})
               OR (m.sender_id = ${otherUserId} AND m.receiver_id = ${req.user.id})
            ORDER BY m.created_at ASC
        `;

        // Fetch basic info of other user for UI context
        const otherUserProfileResult = await sql`
             SELECT p.full_name, p.photo
             FROM profiles p
             WHERE p.user_id = ${otherUserId}
        `;
        const profile = otherUserProfileResult[0] || {};
        

        res.json({
            messages: messages.map(m => ({
                id: m.id,
                content: m.content,
                isSender: m.sender_id === req.user.id,
                createdAt: m.created_at,
                isRead: m.is_read,
                isEdited: m.is_edited
            })),
            otherUser: {
                uniqueId: receiver[0].unique_id,
                fullName: profile.full_name,
                photo: profile.photo
            }
        });
    } catch (error) {
        return dbErrorResponse(res, 'Get messages error', error, 'Failed to fetch messages.');
    }
});

// Send a message
router.post('/send/:uniqueId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        const receiver = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (receiver.length === 0) {
            return res.status(404).json({ error: 'Receiver not found.' });
        }
        const receiverId = receiver[0].id;

        if (receiverId === req.user.id) {
            return res.status(400).json({ error: "Cannot send message to yourself." });
        }

         // Verify neither has ignored the other
         const isIgnored = await sql`
             SELECT 1 FROM ignores
             WHERE (user_id = ${req.user.id} AND ignored_user_id = ${receiverId})
                OR (user_id = ${receiverId} AND ignored_user_id = ${req.user.id})
         `;
 
         if (isIgnored.length > 0) {
              return res.status(403).json({ error: 'Cannot send message to this user.' });
         }

        const result = await sql`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (${req.user.id}, ${receiverId}, ${content.trim()})
            RETURNING id, content, created_at, is_read
        `;

        res.json({
            message: 'Message sent',
            data: {
                id: result[0].id,
                content: result[0].content,
                isSender: true,
                createdAt: result[0].created_at,
                isRead: result[0].is_read
            }
        });
    } catch (error) {
        return dbErrorResponse(res, 'Send message error', error, 'Failed to send message.');
    }
});

// Start a chat without sending message (creates initial dummy contact entry, for chat list UX)
router.post('/start/:uniqueId', auth, async (req, res) => {
    try {
        const receiver = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (receiver.length === 0) {
            return res.status(404).json({ error: 'Receiver not found.' });
        }
        const receiverId = receiver[0].id;

        if (receiverId === req.user.id) {
            return res.status(400).json({ error: "Cannot chat with yourself." });
        }
        
        // We will insert a system-like message to instantiate the chat, or handle empty chats gracefully in the list query.
        // Actually, let's just insert a hidden empty message or special type to make it show up in chat-list.
        // Even simpler: The chat list query only checks messages. Let's insert a "Chat started" message from the user.
        
        const existingMessages = await sql`
            SELECT 1 FROM messages
            WHERE (sender_id = ${req.user.id} AND receiver_id = ${receiverId})
               OR (sender_id = ${receiverId} AND receiver_id = ${req.user.id})
            LIMIT 1
        `;

        if (existingMessages.length === 0) {
             const result = await sql`
                INSERT INTO messages (sender_id, receiver_id, content)
                VALUES (${req.user.id}, ${receiverId}, 'Chat started.')
                RETURNING id
            `;
        }

        res.json({ message: 'Chat initiated' });

    } catch (error) {
         return dbErrorResponse(res, 'Start chat error', error, 'Failed to start chat.');
    }
});

// Edit a message
router.put('/edit/:messageId', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content cannot be empty' });
        }

        const result = await sql`
            UPDATE messages
            SET content = ${content.trim()}, is_edited = true
            WHERE id = ${messageId} AND sender_id = ${req.user.id}
            RETURNING id, content, created_at, is_read, is_edited
        `;

        if (result.length === 0) {
            return res.status(403).json({ error: 'Message not found or unauthorized' });
        }

        res.json({
            message: 'Message edited successfully',
            data: {
                id: result[0].id,
                content: result[0].content,
                isSender: true,
                createdAt: result[0].created_at,
                isRead: result[0].is_read,
                isEdited: result[0].is_edited
            }
        });
    } catch (error) {
         return dbErrorResponse(res, 'Edit message error', error, 'Failed to edit message.');
    }
});

// Delete (Unsend) a message
router.delete('/unsend/:messageId', auth, async (req, res) => {
    try {
        const { messageId } = req.params;

        const result = await sql`
            DELETE FROM messages
            WHERE id = ${messageId} AND sender_id = ${req.user.id}
            RETURNING id
        `;

        if (result.length === 0) {
            return res.status(403).json({ error: 'Message not found or unauthorized' });
        }

        res.json({ message: 'Message unsent successfully' });
    } catch (error) {
         return dbErrorResponse(res, 'Unsend message error', error, 'Failed to unsend message.');
    }
});

export default router;
