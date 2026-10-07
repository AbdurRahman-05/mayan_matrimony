import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';
import { sendPushNotification } from '../pushNotification.js';

const router = Router();

// Send interest
router.post('/send/:uniqueId', auth, async (req, res) => {
    try {
        const { message } = req.body;

        // Find receiver
        const receiver = await sql`
      SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}
    `;

        if (receiver.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const receiverId = receiver[0].id;

        if (receiverId === req.user.id) {
            return res.status(400).json({ error: "You can't send interest to yourself" });
        }

        // Check if already sent
        const existing = await sql`
      SELECT id FROM interests
      WHERE sender_id = ${req.user.id} AND receiver_id = ${receiverId}
    `;

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Interest already sent to this profile' });
        }

        await sql`
      INSERT INTO interests (sender_id, receiver_id, message, status)
      VALUES (${req.user.id}, ${receiverId}, ${message || null}, 'pending')
    `;

        // FCM Trigger
        try {
            const receiverData = await sql`SELECT fcm_token FROM users WHERE id = ${receiverId}`;
            if (receiverData.length > 0 && receiverData[0].fcm_token) {
                const senderData = await sql`
                    SELECT p.full_name, u.unique_id 
                    FROM profiles p 
                    JOIN users u ON u.id = p.user_id 
                    WHERE p.user_id = ${req.user.id}
                `;
                const senderName = senderData.length > 0 ? (senderData[0].full_name || 'A member') : 'A member';
                const senderUniqueId = senderData.length > 0 ? senderData[0].unique_id : '';

                sendPushNotification(
                    receiverData[0].fcm_token,
                    `New Interest Request`,
                    `${senderName} has sent you an interest request.`,
                    { type: 'INTEREST', senderUniqueId: String(senderUniqueId) }
                ).catch(err => console.error('FCM Error:', err));
            }
        } catch (e) {
            console.error('Error sending push notification for interest:', e);
        }

        res.json({ message: 'Interest sent successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Send interest error', error, 'Failed to send interest');
    }
});

// Respond to interest (accept/decline)
router.put('/:id/respond', auth, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Status must be accepted or declined' });
        }

        const interest = await sql`
      SELECT id FROM interests
      WHERE id = ${req.params.id} AND receiver_id = ${req.user.id}
    `;

        if (interest.length === 0) {
            return res.status(404).json({ error: 'Interest not found' });
        }

        await sql`
      UPDATE interests SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id}
    `;

        res.json({ message: `Interest ${status}` });
    } catch (error) {
        return dbErrorResponse(res, 'Respond interest error', error, 'Failed to respond to interest');
    }
});

// Get received interests
router.get('/received', auth, async (req, res) => {
    try {
        const { filter } = req.query; // 'all', 'pending', 'accepted', 'declined'

        let statusCondition = '';
        if (filter && filter !== 'all') {
            statusCondition = `AND i.status = '${filter}'`;
        }

        const query = `
      SELECT i.*, p.full_name, p.photo, p.height, p.religion, p.caste,
             p.education, p.occupation, p.city, p.state, p.country, p.income,
             p.marital_status, p.mother_tongue,
             u.unique_id, u.email, u.mobile,
             p.dob
      FROM interests i
      JOIN users u ON u.id = i.sender_id
      JOIN profiles p ON p.user_id = i.sender_id
      WHERE i.receiver_id = ${req.user.id} ${statusCondition}
        AND NOT EXISTS (
            SELECT 1 FROM ignores ig
            WHERE (ig.user_id = ${req.user.id} AND ig.ignored_user_id = i.sender_id)
               OR (ig.user_id = i.sender_id AND ig.ignored_user_id = ${req.user.id})
        )
      ORDER BY i.created_at DESC
    `;

        const results = await sql`${sql.unsafe(query)}`;

        const interests = results.map(row => ({
            id: row.id,
            status: row.status,
            message: row.message || '',
            createdAt: row.created_at,
            sender: {
                uniqueId: row.unique_id,
                fullName: row.full_name || '',
                photo: row.photo || '',
                age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
                height: row.height || '',
                religion: row.religion || '',
                caste: row.caste || '',
                education: row.education || '',
                occupation: row.occupation || '',
                city: row.city || '',
                state: row.state || '',
                country: row.country || '',
                income: row.income || '',
                mobile: row.mobile || '',
                maritalStatus: row.marital_status || '',
                motherTongue: row.mother_tongue || ''
            }
        }));

        res.json(interests);
    } catch (error) {
        return dbErrorResponse(res, 'Get received interests error', error, 'Failed to get interests');
    }
});

// Get sent interests
router.get('/sent', auth, async (req, res) => {
    try {
        const { filter } = req.query;

        let statusCondition = '';
        if (filter && filter !== 'all') {
            statusCondition = `AND i.status = '${filter}'`;
        }

        const query = `
      SELECT i.*, p.full_name, p.photo, p.height, p.religion, p.caste,
             p.education, p.occupation, p.city, p.state, p.country, p.income,
             p.marital_status, p.mother_tongue,
             u.unique_id, u.email, u.mobile,
             p.dob
      FROM interests i
      JOIN users u ON u.id = i.receiver_id
      JOIN profiles p ON p.user_id = i.receiver_id
      WHERE i.sender_id = ${req.user.id} ${statusCondition}
        AND NOT EXISTS (
            SELECT 1 FROM ignores ig
            WHERE (ig.user_id = ${req.user.id} AND ig.ignored_user_id = i.receiver_id)
               OR (ig.user_id = i.receiver_id AND ig.ignored_user_id = ${req.user.id})
        )
      ORDER BY i.created_at DESC
    `;

        const results = await sql`${sql.unsafe(query)}`;

        const interests = results.map(row => ({
            id: row.id,
            status: row.status,
            message: row.message || '',
            createdAt: row.created_at,
            receiver: {
                uniqueId: row.unique_id,
                fullName: row.full_name || '',
                photo: row.photo || '',
                age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
                height: row.height || '',
                religion: row.religion || '',
                caste: row.caste || '',
                education: row.education || '',
                occupation: row.occupation || '',
                city: row.city || '',
                state: row.state || '',
                country: row.country || '',
                income: row.income || '',
                mobile: row.mobile || '',
                maritalStatus: row.marital_status || '',
                motherTongue: row.mother_tongue || ''
            }
        }));

        res.json(interests);
    } catch (error) {
        return dbErrorResponse(res, 'Get sent interests error', error, 'Failed to get sent interests');
    }
});

export default router;
