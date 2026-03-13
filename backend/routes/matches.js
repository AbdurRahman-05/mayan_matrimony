import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Get matches based on preferences
router.get('/', auth, async (req, res) => {
    try {
        // Get user preferences
        const prefs = await sql`
      SELECT * FROM preferences WHERE user_id = ${req.user.id}
    `;

        // Get user info for opposite gender matching
        const userInfo = await sql`
      SELECT gender FROM users WHERE id = ${req.user.id}
    `;

        const gender = userInfo[0]?.gender;
        const oppositeGender = gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : null;

        let conditions = [`p.user_id != ${req.user.id}`];

        // Exclude ignored profiles
        conditions.push(`p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})`);

        // Exclude blocked profiles
        conditions.push(`p.user_id NOT IN (SELECT blocked_user_id FROM blocks WHERE user_id = ${req.user.id})`);
        conditions.push(`p.user_id NOT IN (SELECT user_id FROM blocks WHERE blocked_user_id = ${req.user.id})`);

        // Exclude deactivated profiles
        conditions.push(`p.user_id NOT IN (SELECT user_id FROM deactivations WHERE is_active = false AND (reactivate_at IS NULL OR reactivate_at > NOW()))`);

        // Match opposite gender
        if (oppositeGender) {
            conditions.push(`p.gender = '${oppositeGender}'`);
        }

        if (prefs.length > 0) {
            const pref = prefs[0];

            // Age filter
            if (pref.pref_age_from && pref.pref_age_to) {
                const today = new Date();
                const maxDob = new Date(today.getFullYear() - parseInt(pref.pref_age_from), today.getMonth(), today.getDate());
                const minDob = new Date(today.getFullYear() - parseInt(pref.pref_age_to) - 1, today.getMonth(), today.getDate());
                conditions.push(`p.dob IS NOT NULL AND p.dob BETWEEN '${minDob.toISOString().split('T')[0]}' AND '${maxDob.toISOString().split('T')[0]}'`);
            }

            if (pref.pref_religion) conditions.push(`p.religion = '${pref.pref_religion.replace(/'/g, "''")}'`);
            if (pref.pref_caste) conditions.push(`p.caste = '${pref.pref_caste.replace(/'/g, "''")}'`);
            if (pref.pref_education) conditions.push(`p.education = '${pref.pref_education.replace(/'/g, "''")}'`);
            if (pref.pref_mother_tongue) conditions.push(`p.mother_tongue = '${pref.pref_mother_tongue.replace(/'/g, "''")}'`);
            if (pref.pref_country) conditions.push(`p.country = '${pref.pref_country.replace(/'/g, "''")}'`);
            if (pref.pref_state) conditions.push(`p.state = '${pref.pref_state.replace(/'/g, "''")}'`);
            if (pref.pref_marital_status) conditions.push(`p.marital_status = '${pref.pref_marital_status.replace(/'/g, "''")}'`);
        }

        const whereClause = conditions.join(' AND ');

        const query = `
      SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

        const results = await sql`${sql.unsafe(query)}`;

        const profiles = results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            religion: row.religion || '',
            caste: row.caste || '',
            country: row.country || '',
            state: row.state || '',
            city: row.city || '',
            education: row.education || '',
            occupation: row.occupation || '',
            income: row.income || '',
            motherTongue: row.mother_tongue || '',
            photo: row.photo || '',
            gender: row.gender || ''
        }));

        res.json(profiles);
    } catch (error) {
        return dbErrorResponse(res, 'Get matches error', error, 'Failed to get matches');
    }
});

// Shortlist a profile
router.post('/shortlist/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        const targetId = target[0].id;
        if (targetId === req.user.id) return res.status(400).json({ error: "Can't shortlist yourself" });

        const existing = await sql`
      SELECT id FROM shortlists WHERE user_id = ${req.user.id} AND shortlisted_user_id = ${targetId}
    `;

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already shortlisted' });
        }

        await sql`
      INSERT INTO shortlists (user_id, shortlisted_user_id)
      VALUES (${req.user.id}, ${targetId})
    `;

        res.json({ message: 'Profile shortlisted' });
    } catch (error) {
        return dbErrorResponse(res, 'Shortlist error', error, 'Failed to shortlist');
    }
});

// Remove from shortlist
router.delete('/shortlist/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        await sql`
      DELETE FROM shortlists WHERE user_id = ${req.user.id} AND shortlisted_user_id = ${target[0].id}
    `;

        res.json({ message: 'Removed from shortlist' });
    } catch (error) {
        return dbErrorResponse(res, 'Remove shortlist error', error, 'Failed to remove from shortlist');
    }
});

// Get shortlisted profiles
router.get('/shortlist', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT p.*, u.unique_id, u.email, u.mobile, s.created_at as shortlisted_at
      FROM shortlists s
      JOIN users u ON u.id = s.shortlisted_user_id
      JOIN profiles p ON p.user_id = s.shortlisted_user_id
      WHERE s.user_id = ${req.user.id}
      AND s.shortlisted_user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})
      ORDER BY s.created_at DESC
    `;

        const profiles = results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            religion: row.religion || '',
            caste: row.caste || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            education: row.education || '',
            occupation: row.occupation || '',
            income: row.income || '',
            photo: row.photo || '',
            shortlistedAt: row.shortlisted_at
        }));

        res.json(profiles);
    } catch (error) {
        return dbErrorResponse(res, 'Get shortlist error', error, 'Failed to get shortlist');
    }
});

// Get who viewed you
router.get('/viewed-you', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT DISTINCT ON (pv.viewer_id)
        pv.viewed_at, p.full_name, p.photo, p.city, p.state, p.country,
        u.unique_id
      FROM profile_views pv
      JOIN users u ON u.id = pv.viewer_id
      JOIN profiles p ON p.user_id = pv.viewer_id
      WHERE pv.viewed_id = ${req.user.id}
      AND pv.viewer_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})
      ORDER BY pv.viewer_id, pv.viewed_at DESC
    `;

        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || 'Member',
            photo: row.photo || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            viewedAt: row.viewed_at
        })));
    } catch (error) {
        return dbErrorResponse(res, 'Viewed you error', error, 'Failed to get views');
    }
});

// Get profiles you viewed
router.get('/viewed-by-you', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT DISTINCT ON (pv.viewed_id)
        pv.viewed_at, p.full_name, p.photo, p.city, p.state, p.country,
        u.unique_id
      FROM profile_views pv
      JOIN users u ON u.id = pv.viewed_id
      JOIN profiles p ON p.user_id = pv.viewed_id
      WHERE pv.viewer_id = ${req.user.id}
      AND pv.viewed_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})
      ORDER BY pv.viewed_id, pv.viewed_at DESC
    `;

        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || 'Member',
            photo: row.photo || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            viewedAt: row.viewed_at
        })));
    } catch (error) {
        return dbErrorResponse(res, 'Viewed by you error', error, 'Failed to get views');
    }
});

// Get who shortlisted you - profiles that shortlisted the current user
router.get('/shortlisted-you', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT p.*, u.unique_id, s.created_at as shortlisted_at
      FROM shortlists s
      JOIN users u ON u.id = s.user_id
      JOIN profiles p ON p.user_id = s.user_id
      WHERE s.shortlisted_user_id = ${req.user.id}
      AND s.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})
      ORDER BY s.created_at DESC
    `;

        const profiles = results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            photo: row.photo || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            shortlistedAt: row.shortlisted_at
        }));

        res.json(profiles);
    } catch (error) {
        return dbErrorResponse(res, 'Shortlisted you error', error, 'Failed to get shortlisted-you list');
    }
});

// Get matches by location (Nearby)
router.get('/nearby', auth, async (req, res) => {
    try {
        const userProfile = await sql`SELECT city, state, country, gender FROM profiles WHERE user_id = ${req.user.id}`;
        if (userProfile.length === 0) return res.status(404).json({ error: 'Profile not found' });

        const { city, state, country, gender } = userProfile[0];
        const oppositeGender = gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : null;

        let conditions = [
            `p.user_id != ${req.user.id}`,
            `p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})`
        ];

        if (oppositeGender) conditions.push(`p.gender = '${oppositeGender}'`);

        // Match city first, then state, then country
        if (city) {
            conditions.push(`p.city = '${city.replace(/'/g, "''")}'`);
        } else if (state) {
            conditions.push(`p.state = '${state.replace(/'/g, "''")}'`);
        } else if (country) {
            conditions.push(`p.country = '${country.replace(/'/g, "''")}'`);
        }

        const query = `
            SELECT p.*, u.unique_id 
            FROM profiles p 
            JOIN users u ON u.id = p.user_id 
            WHERE ${conditions.join(' AND ')} 
            LIMIT 50
        `;
        const results = await sql`${sql.unsafe(query)}`;
        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            religion: row.religion || '',
            caste: row.caste || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            education: row.education || '',
            occupation: row.occupation || '',
            income: row.income || '',
            photo: row.photo || '',
            maritalStatus: row.marital_status || ''
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to get nearby matches' });
    }
});

// Get matches by horoscope
router.get('/horoscope', auth, async (req, res) => {
    try {
        const userProfile = await sql`SELECT horoscope, gender FROM profiles WHERE user_id = ${req.user.id}`;
        const { horoscope, gender } = userProfile[0] || {};
        const oppositeGender = gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : null;

        if (!horoscope) return res.json([]);

        let conditions = [
            `p.user_id != ${req.user.id}`,
            `p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})`,
            `p.horoscope = '${horoscope.replace(/'/g, "''")}'`
        ];

        if (oppositeGender) conditions.push(`p.gender = '${oppositeGender}'`);

        const query = `
            SELECT p.*, u.unique_id 
            FROM profiles p 
            JOIN users u ON u.id = p.user_id 
            WHERE ${conditions.join(' AND ')} 
            LIMIT 50
        `;
        const results = await sql`${sql.unsafe(query)}`;
        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            religion: row.religion || '',
            city: row.city || '',
            photo: row.photo || '',
            horoscope: row.horoscope
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to get horoscope matches' });
    }
});

// Get matches with photos
router.get('/with-photos', auth, async (req, res) => {
    try {
        const userProfile = await sql`SELECT gender FROM profiles WHERE user_id = ${req.user.id}`;
        const gender = userProfile[0]?.gender;
        const oppositeGender = gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : null;

        let conditions = [
            `p.user_id != ${req.user.id}`,
            `p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})`,
            `p.photo IS NOT NULL AND p.photo != ''`
        ];

        if (oppositeGender) conditions.push(`p.gender = '${oppositeGender}'`);

        const query = `
            SELECT p.*, u.unique_id 
            FROM profiles p 
            JOIN users u ON u.id = p.user_id 
            WHERE ${conditions.join(' AND ')} 
            LIMIT 50
        `;
        const results = await sql`${sql.unsafe(query)}`;
        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            religion: row.religion || '',
            city: row.city || '',
            photo: row.photo || ''
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to get matches with photos' });
    }
});

// Ignore a profile
router.post('/ignore/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        const targetId = target[0].id;
        if (targetId === req.user.id) return res.status(400).json({ error: "Can't ignore yourself" });

        const existing = await sql`
      SELECT id FROM ignores WHERE user_id = ${req.user.id} AND ignored_user_id = ${targetId}
    `;

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already ignored' });
        }

        await sql`
      INSERT INTO ignores (user_id, ignored_user_id)
      VALUES (${req.user.id}, ${targetId})
    `;

        res.json({ message: 'Profile ignored' });
    } catch (error) {
        return dbErrorResponse(res, 'Ignore error', error, 'Failed to ignore profile');
    }
});

// Get matches by education preference
router.get('/education-preference', auth, async (req, res) => {
    try {
        const userPrefs = await sql`SELECT pref_education FROM preferences WHERE user_id = ${req.user.id}`;
        const prefEducation = userPrefs[0]?.pref_education;

        if (!prefEducation) {
            return res.json([]);
        }

        const userProfile = await sql`SELECT gender FROM profiles WHERE user_id = ${req.user.id}`;
        const gender = userProfile[0]?.gender;
        const oppositeGender = gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : null;

        let conditions = [
            `p.user_id != ${req.user.id}`,
            `p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${req.user.id})`,
            `p.education = '${prefEducation.replace(/'/g, "''")}'`
        ];

        if (oppositeGender) conditions.push(`p.gender = '${oppositeGender}'`);

        const query = `
            SELECT p.*, u.unique_id 
            FROM profiles p 
            JOIN users u ON u.id = p.user_id 
            WHERE ${conditions.join(' AND ')} 
            LIMIT 50
        `;
        const results = await sql`${sql.unsafe(query)}`;
        res.json(results.map(row => ({
            uniqueId: row.unique_id,
            fullName: row.full_name || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            religion: row.religion || '',
            caste: row.caste || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            education: row.education || '',
            occupation: row.occupation || '',
            income: row.income || '',
            photo: row.photo || '',
            maritalStatus: row.marital_status || ''
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to get education preference matches' });
    }
});

export default router;
