import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Search profiles by criteria
router.post('/', auth, async (req, res) => {
    try {
        const criteria = req.body;
        const currentUserId = req.user.id;

        // Fetch current user's gender for opposite gender filtering
        const currentUserRows = await sql`SELECT gender FROM profiles WHERE user_id = ${currentUserId}`;
        const userGender = currentUserRows.length > 0 ? currentUserRows[0].gender : null;

        // Hard Base Exclusion Conditions
        let baseConditions = [`p.user_id != ${currentUserId}`];
        baseConditions.push(`p.user_id NOT IN (SELECT ignored_user_id FROM ignores WHERE user_id = ${currentUserId})`);
        baseConditions.push(`p.user_id NOT IN (SELECT blocked_user_id FROM blocks WHERE user_id = ${currentUserId})`);
        baseConditions.push(`p.user_id NOT IN (SELECT user_id FROM blocks WHERE blocked_user_id = ${currentUserId})`);
        baseConditions.push(`p.user_id NOT IN (SELECT user_id FROM deactivations WHERE is_active = false AND (reactivate_at IS NULL OR reactivate_at > NOW()))`);

        if (userGender) {
            const oppositeGender = userGender === 'Male' ? 'Female' : (userGender === 'Female' ? 'Male' : null);
            if (oppositeGender) {
                baseConditions.push(`p.gender = '${oppositeGender}'`);
            }
        }

        // Collect specified criteria items for percentage calculation
        const criteriaItems = [];

        if (criteria.ageFrom && criteria.ageTo) {
            criteriaItems.push({ key: 'age', type: 'age_range', min: parseInt(criteria.ageFrom), max: parseInt(criteria.ageTo) });
        }
        if (criteria.religion && criteria.religion.trim() !== '') {
            criteriaItems.push({ key: 'religion', dbCol: 'religion', type: 'single', value: criteria.religion });
        }

        const multiFields = [
            { key: 'maritalStatus', dbCol: 'marital_status' },
            { key: 'motherTongue', dbCol: 'mother_tongue' },
            { key: 'physicalStatus', dbCol: 'physical_status' },
            { key: 'education', dbCol: 'education' },
            { key: 'occupation', dbCol: 'occupation' },
            { key: 'employmentType', dbCol: 'employment_type' },
            { key: 'income', dbCol: 'income' },
            { key: 'country', dbCol: 'country' },
            { key: 'state', dbCol: 'state' },
            { key: 'city', dbCol: 'city' },
            { key: 'residentialStatus', dbCol: 'residential_status' },
            { key: 'smoking', dbCol: 'smoking' },
            { key: 'drinking', dbCol: 'drinking' },
            { key: 'foodHabits', dbCol: 'food_habits' },
            { key: 'caste', dbCol: 'caste' },
            { key: 'section', dbCol: 'sect' },
            { key: 'raasi', dbCol: 'horoscope' },
            { key: 'havingChildren', dbCol: 'having_children' },
            { key: 'profileCreatedBy', dbCol: 'profile_for', isUserTable: true }
        ];

        for (const item of multiFields) {
            const vals = criteria[item.key];
            if (Array.isArray(vals) && vals.length > 0) {
                criteriaItems.push({
                    key: item.key,
                    dbCol: item.dbCol,
                    type: 'multi',
                    values: vals.map(v => String(v).trim().toLowerCase()),
                    isUserTable: item.isUserTable || false
                });
            }
        }

        const whereClause = baseConditions.join(' AND ');
        const query = `
            SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for,
                   (SELECT photo_data FROM profile_photos WHERE user_id = p.user_id ORDER BY is_main DESC, created_at ASC LIMIT 1) as gallery_photo
            FROM profiles p
            JOIN users u ON u.id = p.user_id
            WHERE ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT 200
        `;

        const results = await sql`${sql.unsafe(query)}`;
        const totalSpecified = criteriaItems.length;

        // Process each candidate and calculate match percentage
        const mappedProfiles = results.map(row => {
            let matchedCount = 0;
            const rowAge = row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

            if (totalSpecified > 0) {
                for (const cItem of criteriaItems) {
                    if (cItem.type === 'age_range') {
                        if (rowAge !== null && rowAge >= cItem.min && rowAge <= cItem.max) {
                            matchedCount++;
                        }
                    } else if (cItem.type === 'single') {
                        const val = String(row[cItem.dbCol] || '').trim().toLowerCase();
                        if (val && val === String(cItem.value).trim().toLowerCase()) {
                            matchedCount++;
                        }
                    } else if (cItem.type === 'multi') {
                        const fieldVal = cItem.isUserTable ? String(row.profile_for || '') : String(row[cItem.dbCol] || '');
                        const valLower = fieldVal.trim().toLowerCase();
                        if (valLower && cItem.values.includes(valLower)) {
                            matchedCount++;
                        }
                    }
                }
            }

            const matchPercentage = totalSpecified > 0 ? Math.round((matchedCount / totalSpecified) * 100) : 100;

            const resolvedPhoto = row.photo || row.gallery_photo || '';

            return {
                id: row.id,
                uniqueId: row.unique_id,
                fullName: row.full_name || '',
                age: rowAge,
                height: row.height || '',
                religion: row.religion || '',
                caste: row.caste || '',
                sect: row.sect || '',
                country: row.country || '',
                state: row.state || '',
                city: row.city || '',
                education: row.education || '',
                occupation: row.occupation || '',
                income: row.income || '',
                motherTongue: row.mother_tongue || '',
                mobile: row.mobile || '',
                email: row.email || '',
                photo: resolvedPhoto,
                image: resolvedPhoto,
                maritalStatus: row.marital_status || '',
                gender: row.gender || '',
                smoking: row.smoking || '',
                drinking: row.drinking || '',
                matchPercentage
            };
        });

        // Filter out profiles matching less than 60% (when search criteria are specified)
        let filtered = mappedProfiles;
        if (totalSpecified > 0) {
            filtered = mappedProfiles.filter(p => p.matchPercentage >= 60);
        }

        // Sort from highest percentage (100%) to lowest (60%)
        filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);

        res.json({
            profiles: filtered,
            total: filtered.length,
            totalCriteria: totalSpecified,
            page: 1,
            limit: 50
        });
    } catch (error) {
        return dbErrorResponse(res, 'Search error', error, 'Search failed');
    }
});

// Search by profile ID
router.get('/id/:uniqueId', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for,
             (SELECT photo_data FROM profile_photos WHERE user_id = p.user_id ORDER BY is_main DESC, created_at ASC LIMIT 1) as gallery_photo
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.unique_id = ${req.params.uniqueId}
    `;

        if (results.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const row = results[0];
        const resolvedPhoto = row.photo || row.gallery_photo || '';

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
            photo: resolvedPhoto,
            image: resolvedPhoto,
            maritalStatus: row.marital_status || '',
            gender: row.gender || '',
            profileFor: row.profile_for || ''
        });
    } catch (error) {
        return dbErrorResponse(res, 'Search by ID error', error, 'Search failed');
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
        return dbErrorResponse(res, 'Save search error', error, 'Failed to save search');
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
        return dbErrorResponse(res, 'Get saved searches error', error, 'Failed to get saved searches');
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
        return dbErrorResponse(res, 'Delete saved search error', error, 'Failed to delete saved search');
    }
});

export default router;
