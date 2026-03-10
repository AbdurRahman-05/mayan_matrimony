import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();

// Search profiles by criteria
router.post('/', auth, async (req, res) => {
    try {
        const criteria = req.body;
        const currentUserId = req.user.id;

        // Build dynamic query conditions
        let conditions = [`p.user_id != ${currentUserId}`];

        // Exclude ignored profiles
        conditions.push(`p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${currentUserId})`);

        // Exclude blocked profiles
        conditions.push(`p.user_id NOT IN (SELECT blocked_user_id FROM blocks WHERE user_id = ${currentUserId})`);
        conditions.push(`p.user_id NOT IN (SELECT user_id FROM blocks WHERE blocked_user_id = ${currentUserId})`);

        // Exclude deactivated profiles
        conditions.push(`p.user_id NOT IN (SELECT user_id FROM deactivations WHERE is_active = false AND (reactivate_at IS NULL OR reactivate_at > NOW()))`);

        let params = [];

        // Age filter (calculate from DOB)
        if (criteria.ageFrom && criteria.ageTo) {
            const today = new Date();
            const maxDob = new Date(today.getFullYear() - parseInt(criteria.ageFrom), today.getMonth(), today.getDate());
            const minDob = new Date(today.getFullYear() - parseInt(criteria.ageTo) - 1, today.getMonth(), today.getDate());
            conditions.push(`p.dob IS NOT NULL AND p.dob BETWEEN '${minDob.toISOString().split('T')[0]}' AND '${maxDob.toISOString().split('T')[0]}'`);
        }

        // Height filter
        if (criteria.heightFrom && criteria.heightTo) {
            conditions.push(`p.height IS NOT NULL`);
        }

        // Multi-select filters (arrays)
        const multiSelectFields = {
            maritalStatus: 'marital_status',
            motherTongue: 'mother_tongue',
            physicalStatus: 'physical_status',
            education: 'education',
            occupation: 'occupation',
            employmentType: 'employment_type',
            country: 'country',
            state: 'state',
            city: 'city',
            residentialStatus: 'residential_status',
            smoking: 'smoking',
            drinking: 'drinking',
            foodHabits: 'food_habits',
            caste: 'caste',
            profileCreatedBy: null, // maps to users.profile_for
        };

        for (const [frontendKey, dbColumn] of Object.entries(multiSelectFields)) {
            const values = criteria[frontendKey];
            if (Array.isArray(values) && values.length > 0) {
                if (frontendKey === 'profileCreatedBy') {
                    const escaped = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
                    conditions.push(`u.profile_for IN (${escaped})`);
                } else if (dbColumn) {
                    const escaped = values.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
                    conditions.push(`p.${dbColumn} IN (${escaped})`);
                }
            }
        }

        // Religion (single select)
        if (criteria.religion && criteria.religion !== '') {
            conditions.push(`p.religion = '${criteria.religion.replace(/'/g, "''")}'`);
        }

        // Section filter
        if (Array.isArray(criteria.section) && criteria.section.length > 0) {
            const escaped = criteria.section.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
            conditions.push(`p.sect IN (${escaped})`);
        }

        // Raasi/Horoscope filter
        if (Array.isArray(criteria.raasi) && criteria.raasi.length > 0) {
            const escaped = criteria.raasi.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
            conditions.push(`p.horoscope IN (${escaped})`);
        }

        // Income filter
        if (Array.isArray(criteria.income) && criteria.income.length > 0) {
            const escaped = criteria.income.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
            conditions.push(`p.income IN (${escaped})`);
        }

        // Having children
        if (Array.isArray(criteria.havingChildren) && criteria.havingChildren.length > 0) {
            const escaped = criteria.havingChildren.map(v => `'${v.replace(/'/g, "''")}'`).join(',');
            conditions.push(`p.having_children IN (${escaped})`);
        }

        const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

        const query = `
      SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

        const results = await sql`${sql.unsafe(query)}`;
        // Count total matches
        const countQuery = `
      SELECT COUNT(*) as total
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE ${whereClause}
    `;
        const countResult = await sql`${sql.unsafe(countQuery)}`;

        const profiles = results.map(row => ({
            id: row.id,
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
            mobile: row.mobile || '',
            email: row.email || '',
            photo: row.photo || '',
            image: row.photo || '',
            maritalStatus: row.marital_status || '',
            gender: row.gender || '',
            smoking: row.smoking || '',
            drinking: row.drinking || ''
        }));

        res.json({
            profiles,
            total: parseInt(countResult[0]?.total || 0),
            page: 1,
            limit: 50
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Search by profile ID
router.get('/id/:uniqueId', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.unique_id = ${req.params.uniqueId}
    `;

        if (results.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const row = results[0];

        // Record profile view
        if (row.user_id !== req.user.id) {
            await sql`
        INSERT INTO profile_views (viewer_id, viewed_id)
        VALUES (${req.user.id}, ${row.user_id})
      `;
        }

        res.json({
            id: row.id,
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
            mobile: row.mobile || '',
            email: row.email || '',
            photo: row.photo || '',
            image: row.photo || '',
            maritalStatus: row.marital_status || '',
            gender: row.gender || '',
            profileFor: row.profile_for || ''
        });
    } catch (error) {
        console.error('Search by ID error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Save search criteria
router.post('/save', auth, async (req, res) => {
    try {
        const { name, criteria } = req.body;

        const result = await sql`
      INSERT INTO saved_searches (user_id, name, criteria)
      VALUES (${req.user.id}, ${name || 'My Search'}, ${JSON.stringify(criteria)})
      RETURNING id
    `;

        res.json({ message: 'Search saved', id: result[0].id });
    } catch (error) {
        console.error('Save search error:', error);
        res.status(500).json({ error: 'Failed to save search' });
    }
});

// Get saved searches
router.get('/saved', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT id, name, criteria, created_at FROM saved_searches
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
    `;

        res.json(results.map(r => ({
            id: r.id,
            name: r.name,
            criteria: r.criteria,
            createdAt: r.created_at
        })));
    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({ error: 'Failed to get saved searches' });
    }
});

// Delete saved search
router.delete('/saved/:id', auth, async (req, res) => {
    try {
        await sql`
      DELETE FROM saved_searches
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
        res.json({ message: 'Saved search deleted' });
    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({ error: 'Failed to delete saved search' });
    }
});

export default router;
