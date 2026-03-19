import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';
import { upload } from '../utils/upload.js';

const router = Router();

// Helper: convert DB profile row to frontend-compatible object
function formatProfile(row, req) {
    if (!row) return null;
    const baseUrl = req ? `${req.protocol}://${req.get('host')}` : '';
    
    const processPhoto = (photo) => {
        if (!photo) return '';
        if (photo.startsWith('data:image') || photo.startsWith('http')) return photo;
        return `${baseUrl}${photo}`;
    };

    return {
        id: row.id,
        userId: row.user_id,
        uniqueId: row.unique_id,
        fullName: row.full_name || '',
        gender: row.gender || '',
        dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : '',
        dobDay: row.dob_day || '',
        dobMonth: row.dob_month || '',
        dobYear: row.dob_year || '',
        motherTongue: row.mother_tongue || '',
        email: row.email || '',
        mobile: row.contact_mobile || row.mobile || '',
        registeredMobile: row.mobile || '',
        alternateMobile: row.alternate_mobile || '',
        height: row.height || '',
        physicalStatus: row.physical_status || 'Normal',
        maritalStatus: row.marital_status || 'Never Married',
        havingChildren: row.having_children || '',
        numberOfChildren: row.number_of_children || '',
        religion: row.religion || '',
        sect: row.sect || '',
        caste: row.caste || '',
        horoscope: row.horoscope || '',
        timeOfBirth: row.time_of_birth || '',
        placeOfBirth: row.place_of_birth || '',
        dosham: row.dosham || '',
        star: row.star || '',
        country: row.country || '',
        state: row.state || '',
        city: row.city || '',
        residentialStatus: row.residential_status || '',
        education: row.education || '',
        employmentType: row.employment_type || '',
        occupation: row.occupation || '',
        organizationName: row.organization_name || '',
        currency: row.currency || 'INR',
        income: row.income || '',
        smoking: row.smoking || '',
        drinking: row.drinking || '',
        diet: row.diet || '',
        foodHabits: row.food_habits || '',
        about: row.about || '',
        disability: row.disability || 'None',
        partnerPreference: row.partner_preference || '',
        familyType: row.family_type || '',
        familyStatus: row.family_status || '',
        familyIncome: row.family_income || '',
        fatherOccupation: row.father_occupation || '',
        motherOccupation: row.mother_occupation || '',
        numberOfBrothers: row.brothers || '',
        brothers: row.brothers || '',
        brothersMarried: row.brothers_married || '',
        marriedBrothers: row.brothers_married || '',
        numberOfSisters: row.sisters || '',
        sisters: row.sisters || '',
        sistersMarried: row.sisters_married || '',
        marriedSisters: row.sisters_married || '',
        familyLivingIn: row.family_living_in || '',
        familyCountry: row.family_country || '',
        familyState: row.family_state || '',
        familyCity: row.family_city || '',
        livingWithParents: row.living_with_parents || '',
        contactAddress: row.contact_address || '',
        settlingAbroad: row.settling_abroad || '',
        photo: processPhoto(row.photo),
        profileFor: row.profile_for || 'Self',
        additionalPhotos: [],
        createdAt: row.created_at
    };
}

// Get full profile data (profile + preferences + favourites) in one call
router.get('/full', auth, async (req, res) => {
    try {
        const [profileResults, photos, prefResults, favResults] = await Promise.all([
            sql`
                SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for
                FROM profiles p
                JOIN users u ON u.id = p.user_id
                WHERE p.user_id = ${req.user.id}
            `,
            sql`
                SELECT id, photo_data, is_main FROM profile_photos
                WHERE user_id = ${req.user.id}
                ORDER BY is_main DESC, created_at ASC
            `,
            sql`SELECT * FROM preferences WHERE user_id = ${req.user.id}`,
            sql`SELECT * FROM user_favourites WHERE user_id = ${req.user.id}`
        ]);

        // Build profile
        let profile = {};
        if (profileResults.length > 0) {
            profile = formatProfile(profileResults[0], req);
            profile.additionalPhotos = photos.filter(p => !p.is_main).map(p => {
                const photo = p.photo_data;
                if (!photo) return '';
                if (photo.startsWith('data:image') || photo.startsWith('http')) return photo;
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                return `${baseUrl}${photo}`;
            });
            const mainPhoto = photos.find(p => p.is_main);
            if (mainPhoto) {
                const photo = mainPhoto.photo_data;
                if (photo.startsWith('data:image') || photo.startsWith('http')) {
                    profile.photo = photo;
                } else {
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    profile.photo = `${baseUrl}${photo}`;
                }
            }
        }

        // Build preferences
        let preferences = {};
        if (prefResults.length > 0) {
            const row = prefResults[0];
            preferences = {
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
            };
        }

        // Build favourites
        let favourites = { hobbies: [], sports: [], movies: [], read: [], tvShows: [], destinations: [] };
        if (favResults.length > 0) {
            const row = favResults[0];
            favourites = {
                hobbies: row.hobbies || [],
                sports: row.sports || [],
                movies: row.movies || [],
                read: row.reading || [],
                tvShows: row.tv_shows || [],
                destinations: row.destinations || []
            };
        }

        res.json({ profile, preferences, favourites });
    } catch (error) {
        return dbErrorResponse(res, 'Get full profile error', error, 'Failed to get full profile data');
    }
});

// Get own profile
router.get('/', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT p.*, u.unique_id, u.email, u.mobile, u.profile_for
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ${req.user.id}
    `;

        if (results.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const profile = formatProfile(results[0], req);

        // Get additional photos
        const photos = await sql`
      SELECT id, photo_data, is_main FROM profile_photos
      WHERE user_id = ${req.user.id}
      ORDER BY is_main DESC, created_at ASC
    `;

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        profile.additionalPhotos = photos
            .filter(p => !p.is_main)
            .map(p => {
                const photo = p.photo_data;
                if (!photo) return '';
                if (photo.startsWith('data:image') || photo.startsWith('http')) return photo;
                return `${baseUrl}${photo}`;
            });

        // If main photo from photos table, use it
        const mainPhoto = photos.find(p => p.is_main);
        if (mainPhoto) {
            const photo = mainPhoto.photo_data;
            if (photo.startsWith('data:image') || photo.startsWith('http')) {
                profile.photo = photo;
            } else {
                profile.photo = `${baseUrl}${photo}`;
            }
        }

        res.json(profile);
    } catch (error) {
        return dbErrorResponse(res, 'Get profile error', error, 'Failed to get profile');
    }
});

// Update own profile
router.put('/', auth, async (req, res) => {
    try {
        const data = req.body;

        await sql`
      UPDATE profiles SET
        full_name = ${data.fullName || null},
        gender = ${data.gender || null},
        dob = ${data.dob || null},
        dob_day = ${data.dobDay || null},
        dob_month = ${data.dobMonth || null},
        dob_year = ${data.dobYear || null},
        mother_tongue = ${data.motherTongue || null},
        height = ${data.height || null},
        physical_status = ${data.physicalStatus || 'Normal'},
        marital_status = ${data.maritalStatus || 'Never Married'},
        having_children = ${data.havingChildren || null},
        number_of_children = ${data.numberOfChildren || null},
        religion = ${data.religion || null},
        sect = ${data.sect || null},
        caste = ${data.caste || null},
        horoscope = ${data.horoscope || null},
        time_of_birth = ${data.timeOfBirth || null},
        place_of_birth = ${data.placeOfBirth || null},
        dosham = ${data.dosham || null},
        star = ${data.star || null},
        country = ${data.country || null},
        state = ${data.state || null},
        city = ${data.city || null},
        residential_status = ${data.residentialStatus || null},
        education = ${data.education || null},
        employment_type = ${data.employmentType || null},
        occupation = ${data.occupation || null},
        organization_name = ${data.organizationName || null},
        currency = ${data.currency || 'INR'},
        income = ${data.income || null},
        smoking = ${data.smoking || null},
        drinking = ${data.drinking || null},
        diet = ${data.diet || null},
        food_habits = ${data.foodHabits || null},
        about = ${data.about || null},
        disability = ${data.disability || null},
        partner_preference = ${data.partnerPreference || null},
        family_type = ${data.familyType || null},
        family_status = ${data.familyStatus || null},
        family_income = ${data.familyIncome || null},
        father_occupation = ${data.fatherOccupation || null},
        mother_occupation = ${data.motherOccupation || null},
        brothers = ${data.numberOfBrothers || data.brothers || null},
        brothers_married = ${data.marriedBrothers || data.brothersMarried || null},
        sisters = ${data.numberOfSisters || data.sisters || null},
        sisters_married = ${data.marriedSisters || data.sistersMarried || null},
        family_living_in = ${data.familyLivingIn || null},
        family_country = ${data.familyCountry || null},
        family_state = ${data.familyState || null},
        family_city = ${data.familyCity || null},
        living_with_parents = ${data.livingWithParents || null},
        contact_address = ${data.contactAddress || null},
        settling_abroad = ${data.settlingAbroad || null},
        contact_mobile = ${data.mobile || null},
        alternate_mobile = ${data.alternateMobile || null},
        photo = ${data.photo || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${req.user.id}
    `;

        // Also update user gender if changed
        if (data.gender) {
            await sql`UPDATE users SET gender = ${data.gender}, updated_at = CURRENT_TIMESTAMP WHERE id = ${req.user.id}`;
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Update profile error', error, 'Failed to update profile');
    }
});

// Get profile by unique ID (public/other user)
router.get('/:uniqueId', auth, async (req, res) => {
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

        const profile = formatProfile(results[0]);

        // Get photos
        const photos = await sql`
      SELECT photo_data, is_main FROM profile_photos
      WHERE user_id = ${results[0].user_id}
      ORDER BY is_main DESC, created_at ASC
    `;

        profile.additionalPhotos = photos.filter(p => !p.is_main).map(p => {
            const photo = p.photo_data;
            if (!photo) return '';
            if (photo.startsWith('data:image') || photo.startsWith('http')) return photo;
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            return `${baseUrl}${photo}`;
        });
        const mainPhoto = photos.find(p => p.is_main);
        if (mainPhoto) {
            const photo = mainPhoto.photo_data;
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            if (photo.startsWith('data:image') || photo.startsWith('http')) {
                profile.photo = photo;
            } else {
                profile.photo = `${baseUrl}${photo}`;
            }
        }

        // Record profile view (only if viewing someone else)
        const viewedUserId = results[0].user_id;
        if (viewedUserId !== req.user.id) {
            await sql`
        INSERT INTO profile_views (viewer_id, viewed_id)
        VALUES (${req.user.id}, ${viewedUserId})
      `;
        }

        res.json(profile);
    } catch (error) {
        return dbErrorResponse(res, 'Get profile by ID error', error, 'Failed to get profile');
    }
});

// Upload photo
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
    try {
        const isMain = req.body.isMain === 'true';
        let photoPath = null;

        if (req.file) {
            photoPath = `/uploads/profiles/${req.file.filename}`;
        } else if (req.body.photoData) {
            // Fallback for base64 if needed, but we prefer file upload
            photoPath = req.body.photoData;
        }

        if (!photoPath) {
            return res.status(400).json({ error: 'Photo is required' });
        }

        // Enforce max 3 photos limit
        const existingPhotos = await sql`SELECT COUNT(*) as count FROM profile_photos WHERE user_id = ${req.user.id}`;
        if (parseInt(existingPhotos[0].count) >= 3) {
            return res.status(400).json({ error: 'Maximum 3 photos allowed. Please delete an existing photo before uploading a new one.' });
        }

        // If setting as main, unset previous main
        if (isMain) {
            await sql`UPDATE profile_photos SET is_main = false WHERE user_id = ${req.user.id}`;
            await sql`UPDATE profiles SET photo = ${photoPath} WHERE user_id = ${req.user.id}`;
        }

        const result = await sql`
      INSERT INTO profile_photos (user_id, photo_data, is_main)
      VALUES (${req.user.id}, ${photoPath}, ${isMain})
      RETURNING id
    `;

        res.json({ message: 'Photo uploaded', photoId: result[0].id, photoPath });
    } catch (error) {
        return dbErrorResponse(res, 'Upload photo error', error, 'Failed to upload photo');
    }
});

// Delete photo
router.delete('/photo/:photoId', auth, async (req, res) => {
    try {
        const photo = await sql`
      SELECT id, is_main FROM profile_photos
      WHERE id = ${req.params.photoId} AND user_id = ${req.user.id}
    `;

        if (photo.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        await sql`DELETE FROM profile_photos WHERE id = ${req.params.photoId}`;

        // If main was deleted, promote next photo
        if (photo[0].is_main) {
            const nextPhoto = await sql`
        SELECT id, photo_data FROM profile_photos
        WHERE user_id = ${req.user.id}
        ORDER BY created_at ASC LIMIT 1
      `;
            if (nextPhoto.length > 0) {
                await sql`UPDATE profile_photos SET is_main = true WHERE id = ${nextPhoto[0].id}`;
                await sql`UPDATE profiles SET photo = ${nextPhoto[0].photo_data} WHERE user_id = ${req.user.id}`;
            } else {
                await sql`UPDATE profiles SET photo = NULL WHERE user_id = ${req.user.id}`;
            }
        }

        res.json({ message: 'Photo deleted' });
    } catch (error) {
        return dbErrorResponse(res, 'Delete photo error', error, 'Failed to delete photo');
    }
});

// Set photo as main
router.put('/photo/:photoId/set-main', auth, async (req, res) => {
    try {
        const photo = await sql`
      SELECT id, photo_data FROM profile_photos
      WHERE id = ${req.params.photoId} AND user_id = ${req.user.id}
    `;

        if (photo.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        await sql`UPDATE profile_photos SET is_main = false WHERE user_id = ${req.user.id}`;
        await sql`UPDATE profile_photos SET is_main = true WHERE id = ${req.params.photoId}`;
        await sql`UPDATE profiles SET photo = ${photo[0].photo_data} WHERE user_id = ${req.user.id}`;

        res.json({ message: 'Main photo updated' });
    } catch (error) {
        return dbErrorResponse(res, 'Set main photo error', error, 'Failed to set main photo');
    }
});

// Sync all photos
router.put('/photos/sync', auth, upload.array('photos', 3), async (req, res) => {
    try {
        const files = req.files || [];
        const { photoManifest } = req.body; // JSON string explaining which file is which
        let manifest = [];
        try {
            manifest = JSON.parse(photoManifest || '[]');
        } catch (e) {
            console.error('Manifest parse error', e);
        }

        // Enforce max 3 photos limit
        if (manifest.length > 3) {
            return res.status(400).json({ error: 'Maximum 3 photos allowed.' });
        }

        await sql`DELETE FROM profile_photos WHERE user_id = ${req.user.id}`;

        let mainPhoto = null;
        
        // Handle files from manifest
        for (let i = 0; i < manifest.length; i++) {
            const item = manifest[i];
            let finalPhotoData = item.src;

            // If it's a new file, find it in req.files
            if (item.isNew && item.fileIndex !== undefined) {
                const file = files[item.fileIndex];
                if (file) {
                    finalPhotoData = `/uploads/profiles/${file.filename}`;
                }
            } else if (item.src && item.src.includes('/uploads/')) {
                // Keep existing path but strip protocol/host if present
                try {
                    const url = new URL(item.src);
                    finalPhotoData = url.pathname;
                } catch (e) {
                    finalPhotoData = item.src;
                }
            }

            await sql`
                INSERT INTO profile_photos (user_id, photo_data, is_main)
                VALUES (${req.user.id}, ${finalPhotoData}, ${item.isMain})
            `;
            if (item.isMain) mainPhoto = finalPhotoData;
        }

        await sql`UPDATE profiles SET photo = ${mainPhoto} WHERE user_id = ${req.user.id}`;

        res.json({ message: 'Photos synced successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Sync photos error', error, 'Failed to sync photos');
    }
});

export default router;
