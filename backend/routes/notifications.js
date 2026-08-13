import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = [];

        // 1. Users who viewed this user's profile
        const views = await sql`
            SELECT pv.id, pv.viewed_at, p.full_name, u.unique_id
            FROM profile_views pv
            JOIN users u ON u.id = pv.viewer_id
            JOIN profiles p ON p.user_id = pv.viewer_id
            WHERE pv.viewed_id = ${userId} AND pv.viewer_id != ${userId}
            ORDER BY pv.viewed_at DESC
            LIMIT 15
        `;

        for (const view of views) {
            notifications.push({
                id: `view_${view.id}`,
                type: 'profile_view',
                title: 'Profile Viewed',
                message: `${view.full_name || view.unique_id} (${view.unique_id}) viewed your profile.`,
                timestamp: view.viewed_at,
                link: `/profile/${view.unique_id}`,
                userId: view.unique_id,
                userName: view.full_name || view.unique_id
            });
        }

        // 2. Recent received interests
        const interests = await sql`
            SELECT i.id, i.status, i.created_at,
                   p.full_name, u.unique_id
            FROM interests i
            JOIN users u ON u.id = i.sender_id
            JOIN profiles p ON p.user_id = i.sender_id
            WHERE i.receiver_id = ${userId}
            ORDER BY i.created_at DESC
            LIMIT 15
        `;

        for (const interest of interests) {
            notifications.push({
                id: `interest_${interest.id}`,
                type: 'interest',
                title: 'New Interest Received',
                message: `${interest.full_name || interest.unique_id} (${interest.unique_id}) sent you an interest.`,
                timestamp: interest.created_at,
                link: '/interests',
                userId: interest.unique_id,
                userName: interest.full_name || interest.unique_id,
                status: interest.status
            });
        }

        // 3. Users who shortlisted this user's profile
        const shortlistedBy = await sql`
            SELECT s.id, s.created_at, p.full_name, u.unique_id
            FROM shortlists s
            JOIN users u ON u.id = s.user_id
            JOIN profiles p ON p.user_id = s.user_id
            WHERE s.shortlisted_user_id = ${userId} AND s.user_id != ${userId}
            ORDER BY s.created_at DESC
            LIMIT 15
        `;

        for (const item of shortlistedBy) {
            notifications.push({
                id: `shortlisted_by_${item.id}`,
                type: 'shortlisted_by',
                title: 'You Were Shortlisted',
                message: `${item.full_name || item.unique_id} (${item.unique_id}) shortlisted your profile.`,
                timestamp: item.created_at,
                link: '/matches',
                userId: item.unique_id,
                userName: item.full_name || item.unique_id
            });
        }

        // 4. Photo Requests received (only pending requests)
        const photoReqs = await sql`
            SELECT pr.id, pr.status, pr.created_at, p.full_name, u.unique_id
            FROM photo_requests pr
            JOIN users u ON u.id = pr.requester_id
            JOIN profiles p ON p.user_id = pr.requester_id
            WHERE pr.target_id = ${userId} AND pr.status = 'pending'
            ORDER BY pr.created_at DESC
            LIMIT 15
        `;

        for (const reqItem of photoReqs) {
            notifications.push({
                id: `photo_req_${reqItem.id}`,
                type: 'photo_request',
                requestId: reqItem.id,
                title: 'Photo Request Received',
                message: `${reqItem.full_name || reqItem.unique_id} (${reqItem.unique_id}) requested to view your profile photo.`,
                timestamp: reqItem.created_at,
                link: `/profile/${reqItem.unique_id}`,
                userId: reqItem.unique_id,
                userName: reqItem.full_name || reqItem.unique_id,
                status: reqItem.status
            });
        }

        // 5. Photo Requests accepted (where current user was the requester)
        const acceptedReqs = await sql`
            SELECT pr.id, pr.created_at, pr.updated_at, p.full_name, u.unique_id
            FROM photo_requests pr
            JOIN users u ON u.id = pr.target_id
            JOIN profiles p ON p.user_id = pr.target_id
            WHERE pr.requester_id = ${userId} AND pr.status = 'accepted'
            ORDER BY pr.updated_at DESC
            LIMIT 15
        `;

        for (const accItem of acceptedReqs) {
            notifications.push({
                id: `photo_acc_${accItem.id}`,
                type: 'photo_request_accepted',
                requestId: accItem.id,
                title: 'Photo Request Approved! 🎉',
                message: `${accItem.full_name || accItem.unique_id} (${accItem.unique_id}) accepted your photo request!`,
                timestamp: accItem.updated_at || accItem.created_at,
                link: `/profile/${accItem.unique_id}`,
                userId: accItem.unique_id,
                userName: accItem.full_name || accItem.unique_id,
                status: 'accepted'
            });
        }

        // Sort by timestamp (newest first)
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ notifications, total: notifications.length });
    } catch (error) {
        return dbErrorResponse(res, 'Get notifications error', error, 'Failed to get notifications');
    }
});

// Request to view a user's photo
router.post('/photo-request', auth, async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: 'Target user ID is required' });
        }

        let targetId = parseInt(targetUserId);
        if (isNaN(targetId)) {
            const targetUser = await sql`SELECT id FROM users WHERE unique_id = ${targetUserId}`;
            if (targetUser.length === 0) {
                return res.status(404).json({ error: 'Target user not found' });
            }
            targetId = targetUser[0].id;
        }

        if (targetId === requesterId) {
            return res.status(400).json({ error: 'Cannot request photo from yourself' });
        }

        await sql`
            INSERT INTO photo_requests (requester_id, target_id, status)
            VALUES (${requesterId}, ${targetId}, 'pending')
            ON CONFLICT (requester_id, target_id) 
            DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP
        `;

        res.json({ message: 'Photo request sent successfully', status: 'pending' });
    } catch (error) {
        return dbErrorResponse(res, 'Request photo error', error, 'Failed to send photo request');
    }
});

// Respond to photo request (Accept or Decline)
router.put('/photo-request/:id/respond', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const requestId = parseInt(req.params.id);
        const { action } = req.body;

        if (!['accept', 'reject', 'decline'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        const updated = await sql`
            UPDATE photo_requests
            SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${requestId} AND target_id = ${userId}
            RETURNING *
        `;

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Photo request not found or not authorized' });
        }

        res.json({ message: `Photo request ${newStatus} successfully`, status: newStatus });
    } catch (error) {
        return dbErrorResponse(res, 'Respond photo request error', error, 'Failed to respond to photo request');
    }
});

// Get photo requests status & list of accepted target user IDs
router.get('/photo-requests', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const sent = await sql`
            SELECT pr.id, pr.target_id, pr.status, u.unique_id as target_unique_id
            FROM photo_requests pr
            JOIN users u ON u.id = pr.target_id
            WHERE pr.requester_id = ${userId}
        `;

        const received = await sql`
            SELECT pr.id, pr.requester_id, pr.status, u.unique_id as requester_unique_id, p.full_name
            FROM photo_requests pr
            JOIN users u ON u.id = pr.requester_id
            JOIN profiles p ON p.user_id = pr.requester_id
            WHERE pr.target_id = ${userId}
        `;

        const acceptedTargetIds = sent.filter(s => s.status === 'accepted').map(s => s.target_id);
        const acceptedTargetUniqueIds = sent.filter(s => s.status === 'accepted').map(s => s.target_unique_id);

        res.json({
            sent,
            received,
            acceptedTargetIds,
            acceptedTargetUniqueIds
        });
    } catch (error) {
        return dbErrorResponse(res, 'Get photo requests error', error, 'Failed to fetch photo requests');
    }
});

export default router;
