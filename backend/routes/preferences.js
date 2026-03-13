import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Get preferences
router.get('/', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT * FROM preferences WHERE user_id = ${req.user.id}
    `;

        if (results.length === 0) {
            return res.json({});
        }

        const row = results[0];
        res.json({
            prefAgeFrom: row.pref_age_from || '18',
            prefAgeTo: row.pref_age_to || '30',
            prefHeightFrom: row.pref_height_from || '',
            prefHeightTo: row.pref_height_to || '',
            prefReligion: row.pref_religion || '',
            prefCaste: row.pref_caste || '',
            prefEducation: row.pref_education || '',
            prefOccupation: row.pref_occupation || '',
            prefMaritalStatus: row.pref_marital_status || '',
            prefHavingChildren: row.pref_having_children || '',
            prefCountry: row.pref_country || '',
            prefState: row.pref_state || '',
            prefCity: row.pref_city || '',
            prefMotherTongue: row.pref_mother_tongue || '',
            prefPhysicalStatus: row.pref_physical_status || '',
            prefEmploymentType: row.pref_employment_type || '',
            prefFamilyStatus: row.pref_family_status || '',
            prefFamilyType: row.pref_family_type || '',
            prefLivingWithParents: row.pref_living_with_parents || '',
            prefDietary: row.pref_dietary || '',
            prefSmoking: row.pref_smoking || '',
            prefDrinking: row.pref_drinking || '',
            prefHoroscope: row.pref_horoscope || '',
            prefIncome: row.pref_income || ''
        });
    } catch (error) {
        return dbErrorResponse(res, 'Get preferences error', error, 'Failed to get preferences');
    }
});

// Update preferences
router.put('/', auth, async (req, res) => {
    try {
        const data = req.body;

        const existing = await sql`SELECT id FROM preferences WHERE user_id = ${req.user.id}`;

        if (existing.length === 0) {
            await sql`
        INSERT INTO preferences (
          user_id, pref_age_from, pref_age_to, pref_height_from, pref_height_to,
          pref_religion, pref_caste, pref_education, pref_occupation,
          pref_marital_status, pref_having_children, pref_country, pref_state, pref_city,
          pref_mother_tongue, pref_physical_status, pref_employment_type,
          pref_family_status, pref_family_type, pref_living_with_parents,
          pref_dietary, pref_smoking, pref_drinking, pref_horoscope, pref_income
        ) VALUES (
          ${req.user.id},
          ${data.prefAgeFrom || '18'}, ${data.prefAgeTo || '30'},
          ${data.prefHeightFrom || null}, ${data.prefHeightTo || null},
          ${data.prefReligion || null}, ${data.prefCaste || null},
          ${data.prefEducation || null}, ${data.prefOccupation || null},
          ${data.prefMaritalStatus || null}, ${data.prefHavingChildren || null},
          ${data.prefCountry || null}, ${data.prefState || null}, ${data.prefCity || null},
          ${data.prefMotherTongue || null}, ${data.prefPhysicalStatus || null},
          ${data.prefEmploymentType || null},
          ${data.prefFamilyStatus || null}, ${data.prefFamilyType || null},
          ${data.prefLivingWithParents || null},
          ${data.prefDietary || null}, ${data.prefSmoking || null},
          ${data.prefDrinking || null}, ${data.prefHoroscope || null},
          ${data.prefIncome || null}
        )
      `;
        } else {
            await sql`
        UPDATE preferences SET
          pref_age_from = ${data.prefAgeFrom || '18'},
          pref_age_to = ${data.prefAgeTo || '30'},
          pref_height_from = ${data.prefHeightFrom || null},
          pref_height_to = ${data.prefHeightTo || null},
          pref_religion = ${data.prefReligion || null},
          pref_caste = ${data.prefCaste || null},
          pref_education = ${data.prefEducation || null},
          pref_occupation = ${data.prefOccupation || null},
          pref_marital_status = ${data.prefMaritalStatus || null},
          pref_having_children = ${data.prefHavingChildren || null},
          pref_country = ${data.prefCountry || null},
          pref_state = ${data.prefState || null},
          pref_city = ${data.prefCity || null},
          pref_mother_tongue = ${data.prefMotherTongue || null},
          pref_physical_status = ${data.prefPhysicalStatus || null},
          pref_employment_type = ${data.prefEmploymentType || null},
          pref_family_status = ${data.prefFamilyStatus || null},
          pref_family_type = ${data.prefFamilyType || null},
          pref_living_with_parents = ${data.prefLivingWithParents || null},
          pref_dietary = ${data.prefDietary || null},
          pref_smoking = ${data.prefSmoking || null},
          pref_drinking = ${data.prefDrinking || null},
          pref_horoscope = ${data.prefHoroscope || null},
          pref_income = ${data.prefIncome || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${req.user.id}
      `;
        }

        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Update preferences error', error, 'Failed to update preferences');
    }
});

export default router;
