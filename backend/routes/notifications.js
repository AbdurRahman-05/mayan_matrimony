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

        // 1. Profiles the current user has shortlisted (user's own action)
        const myShortlists = await sql`
            SELECT s.id, s.created_at, u.unique_id, p.full_name
            FROM shortlists s
            JOIN users u ON u.id = s.shortlisted_user_id
            JOIN profiles p ON p.user_id = s.shortlisted_user_id
            WHERE s.user_id = ${userId}
            ORDER BY s.created_at DESC
            LIMIT 10
        `;

        for (const item of myShortlists) {
            notifications.push({
                id: `my_shortlist_${item.id}`,
                type: 'my_shortlist',
                title: 'Profile Shortlisted',
                message: `You have shortlisted this user – ${item.unique_id}`,
                timestamp: item.created_at,
                link: `/profile/${item.unique_id}`,
                userId: item.unique_id,
                userName: item.full_name || item.unique_id
            });
        }

        // 2. Users who viewed this user's profile
        const views = await sql`
            SELECT pv.id, pv.viewed_at, p.full_name, u.unique_id
            FROM profile_views pv
            JOIN users u ON u.id = pv.viewer_id
            JOIN profiles p ON p.user_id = pv.viewer_id
            WHERE pv.viewed_id = ${userId}
            ORDER BY pv.viewed_at DESC
            LIMIT 10
        `;

        for (const view of views) {
            notifications.push({
                id: `view_${view.id}`,
                type: 'profile_view',
                title: 'Profile Viewed',
                message: `${view.unique_id} has viewed your profile.`,
                timestamp: view.viewed_at,
                link: `/profile/${view.unique_id}`,
                userId: view.unique_id,
                userName: view.full_name || view.unique_id
            });
        }

        // 3. Recent received interests
        const interests = await sql`
            SELECT i.id, i.status, i.created_at,
                   p.full_name, u.unique_id
            FROM interests i
            JOIN users u ON u.id = i.sender_id
            JOIN profiles p ON p.user_id = i.sender_id
            WHERE i.receiver_id = ${userId}
            ORDER BY i.created_at DESC
            LIMIT 10
        `;

        for (const interest of interests) {
            notifications.push({
                id: `interest_${interest.id}`,
                type: 'interest',
                title: 'New Interest Received',
                message: `${interest.unique_id} has sent you an interest.`,
                timestamp: interest.created_at,
                link: '/interests',
                userId: interest.unique_id,
                userName: interest.full_name || interest.unique_id,
                status: interest.status
            });
        }

        // 4. Users who shortlisted this user's profile
        const shortlistedBy = await sql`
            SELECT s.id, s.created_at, p.full_name, u.unique_id
            FROM shortlists s
            JOIN users u ON u.id = s.user_id
            JOIN profiles p ON p.user_id = s.user_id
            WHERE s.shortlisted_user_id = ${userId}
            ORDER BY s.created_at DESC
            LIMIT 10
        `;

        for (const item of shortlistedBy) {
            notifications.push({
                id: `shortlisted_by_${item.id}`,
                type: 'shortlisted_by',
                title: 'You Were Shortlisted',
                message: `${item.unique_id} has shortlisted your profile.`,
                timestamp: item.created_at,
                link: '/matches',
                userId: item.unique_id,
                userName: item.full_name || item.unique_id
            });
        }

        // Get user profile for match-based notifications
        const userProfile = await sql`
            SELECT city, state, country, gender, horoscope, photo
            FROM profiles WHERE user_id = ${userId}
        `;

        if (userProfile.length > 0) {
            const profile = userProfile[0];
            const oppositeGender = profile.gender === 'Male' ? 'Female' : 'Male';

            // 5. Horoscope matches
            if (profile.horoscope) {
                const horoscopeCount = await sql`
                    SELECT COUNT(*) as count
                    FROM profiles p
                    JOIN users u ON u.id = p.user_id
                    WHERE p.horoscope = ${profile.horoscope}
                    AND p.gender = ${oppositeGender}
                    AND p.user_id != ${userId}
                `;

                const hCount = parseInt(horoscopeCount[0]?.count || 0);
                if (hCount > 0) {
                    notifications.push({
                        id: 'horoscope_matches',
                        type: 'horoscope',
                        title: 'Horoscope Matches',
                        message: `You have ${hCount} new horoscope matches.`,
                        timestamp: new Date().toISOString(),
                        link: '/matches',
                        count: hCount
                    });
                }
            }

            // 6. Matches with photos (photo-based matches)
            const photoMatchCount = await sql`
                SELECT COUNT(*) as count
                FROM profiles p
                JOIN users u ON u.id = p.user_id
                WHERE p.photo IS NOT NULL AND p.photo != ''
                AND p.gender = ${oppositeGender}
                AND p.user_id != ${userId}
            `;

            const pCount = parseInt(photoMatchCount[0]?.count || 0);
            if (pCount > 0) {
                notifications.push({
                    id: 'photo_matches',
                    type: 'photo_match',
                    title: 'Photo Matches',
                    message: `You have ${pCount} new matches based on photo similarity.`,
                    timestamp: new Date().toISOString(),
                    link: '/matches',
                    count: pCount
                });
            }

            // 7. Nearby matches (same city)
            if (profile.city) {
                const nearbyCount = await sql`
                    SELECT COUNT(*) as count
                    FROM profiles p
                    JOIN users u ON u.id = p.user_id
                    WHERE p.city = ${profile.city}
                    AND p.gender = ${oppositeGender}
                    AND p.user_id != ${userId}
                `;

                const nCount = parseInt(nearbyCount[0]?.count || 0);
                if (nCount > 0) {
                    notifications.push({
                        id: 'nearby_matches',
                        type: 'nearby',
                        title: 'Nearby Matches',
                        message: `You have ${nCount} new nearby matches in ${profile.city}.`,
                        timestamp: new Date().toISOString(),
                        link: '/matches',
                        count: nCount
                    });
                }
            }

            // 8. Profile completeness check
            const fullProfile = await sql`
                SELECT * FROM profiles WHERE user_id = ${userId}
            `;

            if (fullProfile.length > 0) {
                const p = fullProfile[0];
                const fields = [
                    p.full_name, p.gender, p.dob, p.mother_tongue, p.height,
                    p.religion, p.caste, p.country, p.state, p.city,
                    p.education, p.occupation, p.income, p.about,
                    p.family_type, p.father_occupation, p.mother_occupation,
                    p.photo, p.marital_status, p.diet
                ];

                const filled = fields.filter(f => f && f.toString().trim() !== '').length;
                const percentage = Math.round((filled / fields.length) * 100);

                if (percentage < 100) {
                    notifications.push({
                        id: 'profile_incomplete',
                        type: 'profile_incomplete',
                        title: 'Complete Your Profile',
                        message: `Your profile is ${percentage}% complete. Complete your profile to get more matches!`,
                        timestamp: new Date().toISOString(),
                        link: '/home',
                        percentage
                    });
                }
            }
        }

        // 9. Photo Requests received
        const photoReqs = await sql`
            SELECT pr.id, pr.status, pr.created_at, p.full_name, u.unique_id
            FROM photo_requests pr
            JOIN users u ON u.id = pr.requester_id
            JOIN profiles p ON p.user_id = pr.requester_id
            WHERE pr.target_id = ${userId}
            ORDER BY pr.created_at DESC
            LIMIT 15
        `;

        for (const reqItem of photoReqs) {
            notifications.push({
                id: `photo_req_${reqItem.id}`,
                type: 'photo_request',
                requestId: reqItem.id,
                title: reqItem.status === 'accepted' ? 'Photo Request Accepted' : 'Photo Request Received',
                message: reqItem.status === 'accepted' 
                    ? `You accepted photo request from ${reqItem.unique_id}` 
                    : `${reqItem.full_name || reqItem.unique_id} (${reqItem.unique_id}) requested to view your profile photo.`,
                timestamp: reqItem.created_at,
                link: `/profile/${reqItem.unique_id}`,
                userId: reqItem.unique_id,
                userName: reqItem.full_name || reqItem.unique_id,
                status: reqItem.status
            });
        }

        // 10. Photo Requests accepted (where current user was the requester)
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
                message: `${accItem.full_name || accItem.unique_id} (${accItem.unique_id}) accepted your photo request! You can now view their profile photo.`,
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
