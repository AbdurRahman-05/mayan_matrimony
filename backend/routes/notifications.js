import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';

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

        // Sort by timestamp (newest first)
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ notifications, total: notifications.length });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

export default router;
