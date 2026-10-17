import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from '../db.js';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { dbErrorResponse } from '../utils/dbError.js';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get frontend public directory path
// Assuming backend is at c:\Matrimony\backend and frontend is at c:\Matrimony\frontend
const frontendPublicPath = path.join(__dirname, '..', '..', 'frontend', 'public');
const storiesFilePath = path.join(__dirname, '..', 'stories.json');

// Default story data
const defaultStories = {
    story1: {
        coupleName: 'Anjush & Pahuja',
        description: 'We met through Sri Mayan and felt an instant connection. The platform made it so easy to find my perfect match. Thank you!'
    },
    story2: {
        coupleName: 'Shobhit & Gaurangi',
        description: 'Sri Mayan helped us find our perfect match effortlessly. The personalized matchmaking experience is truly commendable.'
    },
    story3: {
        coupleName: 'Kanika & Siddharth',
        description: 'We are grateful to the platform for bringing us together. Our families are extremely happy with this beautiful union.'
    }
};

// Initialize stories.json if it doesn't exist
if (!fs.existsSync(storiesFilePath)) {
    fs.writeFileSync(storiesFilePath, JSON.stringify(defaultStories, null, 2));
}

// Helper to read stories
const readStories = () => {
    try {
        const data = fs.readFileSync(storiesFilePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return defaultStories;
    }
};

// Helper to write stories
const writeStories = (data) => {
    fs.writeFileSync(storiesFilePath, JSON.stringify(data, null, 2));
};

// 1. Get stats (number of users)
router.get('/stats', async (req, res) => {
    try {
        const result = await sql`SELECT count(*) as total FROM users`;
        res.json({ totalUsers: parseInt(result[0].total) || 0 });
    } catch (error) {
        return dbErrorResponse(res, 'Error fetching stats', error, 'Failed to fetch stats');
    }
});

// 2. Upload/Replace image
router.post('/images', async (req, res) => {
    try {
        const { target, base64Data } = req.body;
        // target could be: 'hero', 'story1', 'story2', 'story3'

        if (!target || !base64Data) {
            return res.status(400).json({ error: 'Target and base64Data are required' });
        }

        let fileName = '';
        if (target === 'hero') fileName = 'couple_hero.jpg';
        else if (target === 'story1') fileName = 'couple1.png';
        else if (target === 'story2') fileName = 'couple2.png';
        else if (target === 'story3') fileName = 'couple3.png';
        else {
            return res.status(400).json({ error: 'Invalid target' });
        }

        const filePath = path.join(frontendPublicPath, fileName);

        // Extract base64 part safely
        const base64Parts = base64Data.split(',');
        const base64Image = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];

        // Write the file
        fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));

        res.json({ message: 'Image successfully updated', target, fileName });
    } catch (error) {
        console.error('Error updating image:', error);
        res.status(500).json({ error: 'Failed to update image' });
    }
});

// Helper to generate unique ID like SM-XXXXXX
function generateUniqueId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SM-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 3. Get all registered users
router.get('/users', async (req, res) => {
    try {
        const users = await sql`
            SELECT 
                u.id as user_id, 
                u.unique_id,
                COALESCE(p.full_name, 'N/A') as first_name, 
                '' as last_name, 
                COALESCE(u.email, 'No Email') as email, 
                COALESCE(u.mobile, 'No Phone') as phone, 
                COALESCE(u.gender, 'Not Specified') as gender, 
                COALESCE(p.religion, 'Not Specified') as religion,
                COALESCE(p.sect, '') as sect,
                COALESCE(p.caste, 'Not Specified') as caste,
                COALESCE(p.horoscope, 'Not Specified') as horoscope,
                COALESCE(p.mother_tongue, '') as mother_tongue,
                COALESCE(p.marital_status, '') as marital_status,
                COALESCE(p.height, '') as height,
                COALESCE(p.city, '') as city,
                COALESCE(p.state, '') as state,
                COALESCE(p.country, '') as country,
                COALESCE(p.working_country, '') as working_country,
                COALESCE(p.education, '') as education,
                COALESCE(p.employment_type, '') as employment_type,
                COALESCE(p.occupation, '') as occupation,
                COALESCE(p.income, '') as income,
                COALESCE(p.family_type, '') as family_type,
                COALESCE(p.father_name, '') as father_name,
                COALESCE(p.father_occupation, '') as father_occupation,
                COALESCE(p.mother_name, '') as mother_name,
                COALESCE(p.mother_occupation, '') as mother_occupation,
                COALESCE(p.diet, '') as diet,
                p.photo,
                u.is_verified,
                u.last_seen,
                u.created_at 
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ORDER BY u.created_at DESC
        `;
        res.json(users);
    } catch (error) {
        return dbErrorResponse(res, 'Error fetching users', error, 'Failed to fetch users');
    }
});

// 3.1 Register user directly through Admin Console
router.post('/register', async (req, res) => {
    try {
        const {
            fullName, profileFor, gender, dob, dobDay, dobMonth, dobYear,
            nationality, motherTongue, mobile, email, password, isVerified,
            religion, sect, caste, casteOther, willingToMarryOtherCaste,
            maritalStatus, havingChildren, numberOfChildren,
            height, physicalStatus, disability, bodyType, weight,
            horoscope, timeOfBirth, placeOfBirth, dosham,
            country, workingCountry, visaStatus, state, city, residentialStatus,
            education, employmentType, occupation, organizationName, currency, income, extraIncome,
            jobDetails, propertyType, financialStatus,
            diet, smoking, drinking,
            familyType, familyStatus, familyIncome,
            fatherName, fatherStatus, fatherOccupation,
            motherName, motherStatus, motherOccupation,
            elderBrother, marriedElderBrother, youngerBrother, marriedYoungerBrother,
            elderSister, marriedElderSister, youngerSister, marriedYoungerSister,
            familyLivingIn, aadharNumber, temporaryAddress, permanentAddress,
            about, partnerPreference, photo
        } = req.body;

        const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
        const cleanMobile = mobile && typeof mobile === 'string' && mobile.trim() ? mobile.trim() : null;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ error: 'Full name is required' });
        }
        if (!cleanMobile && !cleanEmail) {
            return res.status(400).json({ error: 'Mobile number or email is required' });
        }

        if (cleanEmail) {
            const existingEmail = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
            if (existingEmail.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }
        if (cleanMobile) {
            const existingMobile = await sql`SELECT id FROM users WHERE mobile = ${cleanMobile}`;
            if (existingMobile.length > 0) {
                return res.status(400).json({ error: 'Mobile number already registered' });
            }
        }

        const rawPassword = password && password.trim().length >= 6 ? password.trim() : 'Welcome@123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        let uniqueId = generateUniqueId();
        let idExists = await sql`SELECT id FROM users WHERE unique_id = ${uniqueId}`;
        while (idExists.length > 0) {
            uniqueId = generateUniqueId();
            idExists = await sql`SELECT id FROM users WHERE unique_id = ${uniqueId}`;
        }

        let finalGender = gender || 'Male';
        if (profileFor === 'Son') finalGender = 'Male';
        else if (profileFor === 'Daughter') finalGender = 'Female';

        const finalCaste = caste === 'Other' && casteOther && casteOther.trim() ? casteOther.trim() : (caste || null);
        const finalCountry = country || 'India';
        const finalWorkingCountry = workingCountry || finalCountry;

        const userResult = await sql`
            INSERT INTO users (unique_id, email, mobile, password_hash, profile_for, gender, is_verified)
            VALUES (${uniqueId}, ${cleanEmail}, ${cleanMobile}, ${passwordHash}, ${profileFor || 'Self'}, ${finalGender}, ${isVerified !== false})
            RETURNING id, unique_id, email, mobile, gender, profile_for, created_at, is_verified
        `;
        const newUser = userResult[0];

        await sql`
            INSERT INTO profiles (
                user_id, full_name, gender, dob, dob_day, dob_month, dob_year,
                nationality, mother_tongue, height, physical_status, disability, body_type, weight,
                marital_status, having_children, number_of_children,
                religion, sect, caste, willing_to_marry_other_caste,
                horoscope, time_of_birth, place_of_birth, dosham,
                country, working_country, visa_status, state, city, residential_status,
                education, employment_type, occupation, organization_name, currency, income, extra_income,
                job_details, property_type, financial_status,
                diet, smoking, drinking,
                family_type, family_status, family_income,
                father_name, father_status, father_occupation,
                mother_name, mother_status, mother_occupation,
                elder_brother, married_elder_brother, younger_brother, married_younger_brother,
                elder_sister, married_elder_sister, younger_sister, married_younger_sister,
                family_living_in, aadhar_number, temporary_address, permanent_address,
                about, partner_preference, photo
            ) VALUES (
                ${newUser.id}, ${fullName.trim()}, ${finalGender}, ${dob || null}, ${dobDay || null}, ${dobMonth || null}, ${dobYear || null},
                ${nationality || 'Indian'}, ${motherTongue || null}, ${height || null}, ${physicalStatus || 'Normal'}, ${disability || null}, ${bodyType || null}, ${weight || null},
                ${maritalStatus || 'Never Married'}, ${havingChildren || null}, ${numberOfChildren || null},
                ${religion || null}, ${sect || null}, ${finalCaste}, ${willingToMarryOtherCaste || 'No'},
                ${horoscope || null}, ${timeOfBirth || null}, ${placeOfBirth || null}, ${dosham || null},
                ${finalCountry}, ${finalWorkingCountry}, ${visaStatus || null}, ${state || null}, ${city || null}, ${residentialStatus || null},
                ${education || null}, ${employmentType || null}, ${occupation || null}, ${organizationName || null}, ${currency || 'INR'}, ${income || null}, ${extraIncome || null},
                ${jobDetails || null}, ${propertyType || null}, ${financialStatus || null},
                ${diet || null}, ${smoking || null}, ${drinking || null},
                ${familyType || null}, ${familyStatus || null}, ${familyIncome || null},
                ${fatherName || null}, ${fatherStatus || null}, ${fatherOccupation || null},
                ${motherName || null}, ${motherStatus || null}, ${motherOccupation || null},
                ${elderBrother || '0'}, ${marriedElderBrother || '0'}, ${youngerBrother || '0'}, ${marriedYoungerBrother || '0'},
                ${elderSister || '0'}, ${marriedElderSister || '0'}, ${youngerSister || '0'}, ${marriedYoungerSister || '0'},
                ${familyLivingIn || null}, ${aadharNumber || null}, ${temporaryAddress || null}, ${permanentAddress || null},
                ${about || null}, ${partnerPreference || null}, ${photo || null}
            )
        `;

        if (photo) {
            try {
                await sql`
                    INSERT INTO profile_photos (user_id, photo_data, is_main)
                    VALUES (${newUser.id}, ${photo}, true)
                `;
            } catch (pErr) {
                console.warn('Could not insert into profile_photos:', pErr.message);
            }
        }

        await sql`
            INSERT INTO preferences (user_id, pref_age_from, pref_age_to)
            VALUES (${newUser.id}, '18', '35')
        `;

        await sql`
            INSERT INTO user_favourites (user_id)
            VALUES (${newUser.id})
        `;

        res.json({
            success: true,
            message: 'User registered successfully through admin console',
            user: {
                id: newUser.id,
                uniqueId: newUser.unique_id,
                fullName: fullName.trim(),
                mobile: cleanMobile,
                email: cleanEmail,
                temporaryPassword: rawPassword
            }
        });
    } catch (error) {
        return dbErrorResponse(res, 'Admin registration error', error, 'Failed to register user');
    }
});

// 4. Admin Login
router.post('/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (!id || !password) {
            return res.status(400).json({ success: false, error: 'ID and Password are required' });
        }

        const trimmedId = id.trim().toLowerCase();
        const admins = await sql`SELECT * FROM admin_settings WHERE LOWER(TRIM(email)) = ${trimmedId}`;
        if (admins.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid ID or Password' });
        }

        const admin = admins[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (validPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, error: 'Invalid ID or Password' });
        }
    } catch (error) {
        return dbErrorResponse(res, 'Admin login error', error, 'Login failed due to server error');
    }
});

// Configure Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 4.1 Forgot Password (Send OTP)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const admins = await sql`SELECT * FROM admin_settings WHERE email = ${email}`;
        if (admins.length === 0) {
            return res.status(404).json({ success: false, error: 'No admin account found with this email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiry to 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60000);

        await sql`
            UPDATE admin_settings 
            SET otp = ${otp}, otp_expires = ${expiresAt} 
            WHERE email = ${email}
        `;

        // Check if Resend API key is provided, if not fallback to console
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
            const { data, error } = await resend.emails.send({
                from: 'Matrimony Admin <onboarding@resend.dev>',
                to: email,
                subject: 'Admin Password Reset OTP',
                html: `<p>Your OTP for resetting the admin password is: <b>${otp}</b>.</p><p>It will expire in 10 minutes.</p>`,
            });

            if (error) {
                console.error("[Resend Error]", error);
                throw new Error("Failed to send OTP email via Resend");
            }
            console.log(`[Email Sent] OTP sent to ${email}`);
        } else {
            console.log(`\n================================`);
            console.log(`[Mock Email] OTP for ${email}: ${otp}`);
            console.log(`================================\n`);
        }

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Forgot password error', error, 'Failed to process request');
    }
});

// 4.2 Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Email and OTP are required' });
        }

        const admins = await sql`SELECT otp, otp_expires FROM admin_settings WHERE email = ${email}`;
        if (admins.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin account not found' });
        }

        const admin = admins[0];
        
        if (admin.otp !== otp) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }

        if (new Date() > new Date(admin.otp_expires)) {
            return res.status(400).json({ success: false, error: 'OTP has expired' });
        }

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Verify OTP error', error, 'Verification failed');
    }
});

// 4.3 Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const admins = await sql`SELECT otp, otp_expires FROM admin_settings WHERE email = ${email}`;
        if (admins.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin account not found' });
        }

        const admin = admins[0];
        
        // Double check OTP and expiry one last time
        if (admin.otp !== otp || new Date() > new Date(admin.otp_expires)) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        await sql`
            UPDATE admin_settings 
            SET password_hash = ${hashedPassword}, otp = NULL, otp_expires = NULL 
            WHERE email = ${email}
        `;

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Reset password error', error, 'Failed to reset password');
    }
});

// 4.5. Get full profile for a specific user
router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch user data
        const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch profile data
        const profiles = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
        const preferences = await sql`SELECT * FROM preferences WHERE user_id = ${userId}`;
        const favourites = await sql`SELECT * FROM user_favourites WHERE user_id = ${userId}`;
        const photos = await sql`SELECT id, photo_data, is_main, created_at FROM profile_photos WHERE user_id = ${userId} ORDER BY is_main DESC, created_at ASC`;

        // Combine them
        const userData = { ...users[0] };
        userData.profile = profiles.length > 0 ? profiles[0] : null;
        userData.preferences = preferences.length > 0 ? preferences[0] : null;
        userData.favourites = favourites.length > 0 ? favourites[0] : null;
        userData.photos = photos;

        res.json(userData);
    } catch (error) {
        return dbErrorResponse(res, 'Error fetching user profile', error, 'Failed to fetch user details');
    }
});

// 4.6. Update user details through Admin Console
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;

        const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const currentUser = users[0];

        // Check if email changed and is taken
        const cleanEmail = data.email && typeof data.email === 'string' && data.email.trim() ? data.email.trim().toLowerCase() : null;
        if (cleanEmail && cleanEmail !== currentUser.email) {
            const check = await sql`SELECT id FROM users WHERE email = ${cleanEmail} AND id != ${userId}`;
            if (check.length > 0) {
                return res.status(400).json({ error: 'Email already in use by another user' });
            }
        }

        // Check if mobile changed and is taken
        const cleanMobile = data.mobile && typeof data.mobile === 'string' && data.mobile.trim() ? data.mobile.trim() : null;
        if (cleanMobile && cleanMobile !== currentUser.mobile) {
            const check = await sql`SELECT id FROM users WHERE mobile = ${cleanMobile} AND id != ${userId}`;
            if (check.length > 0) {
                return res.status(400).json({ error: 'Mobile number already in use by another user' });
            }
        }

        // Update password if provided
        if (data.password && data.password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(data.password.trim(), salt);
            await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
        }

        // Update users table
        await sql`
            UPDATE users SET
                email = ${cleanEmail},
                mobile = ${cleanMobile},
                gender = ${data.gender !== undefined ? data.gender : currentUser.gender},
                profile_for = ${data.profileFor !== undefined ? data.profileFor : currentUser.profile_for},
                is_verified = ${data.isVerified !== undefined ? Boolean(data.isVerified) : currentUser.is_verified},
                unique_id = ${data.uniqueId || currentUser.unique_id},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${userId}
        `;

        // Check profile
        const existingProfiles = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
        const finalCaste = data.caste === 'Other' && data.casteOther && data.casteOther.trim() ? data.casteOther.trim() : data.caste;

        if (existingProfiles.length === 0) {
            await sql`
                INSERT INTO profiles (user_id, full_name, gender, religion, sect, caste, photo, created_at)
                VALUES (${userId}, ${data.fullName || ''}, ${data.gender || 'Male'}, ${data.religion || ''}, ${data.sect || ''}, ${finalCaste || ''}, ${data.photo || null}, CURRENT_TIMESTAMP)
            `;
        } else {
            const curr = existingProfiles[0];
            await sql`
                UPDATE profiles SET
                    full_name = ${data.fullName !== undefined ? data.fullName : curr.full_name},
                    gender = ${data.gender !== undefined ? data.gender : curr.gender},
                    dob = ${data.dob !== undefined ? data.dob : curr.dob},
                    dob_day = ${data.dobDay !== undefined ? data.dobDay : curr.dob_day},
                    dob_month = ${data.dobMonth !== undefined ? data.dobMonth : curr.dob_month},
                    dob_year = ${data.dobYear !== undefined ? data.dobYear : curr.dob_year},
                    nationality = ${data.nationality !== undefined ? data.nationality : curr.nationality},
                    mother_tongue = ${data.motherTongue !== undefined ? data.motherTongue : curr.mother_tongue},
                    height = ${data.height !== undefined ? data.height : curr.height},
                    physical_status = ${data.physicalStatus !== undefined ? data.physicalStatus : curr.physical_status},
                    disability = ${data.disability !== undefined ? data.disability : curr.disability},
                    body_type = ${data.bodyType !== undefined ? data.bodyType : curr.body_type},
                    weight = ${data.weight !== undefined ? data.weight : curr.weight},
                    marital_status = ${data.maritalStatus !== undefined ? data.maritalStatus : curr.marital_status},
                    having_children = ${data.havingChildren !== undefined ? data.havingChildren : curr.having_children},
                    number_of_children = ${data.numberOfChildren !== undefined ? data.numberOfChildren : curr.number_of_children},
                    religion = ${data.religion !== undefined ? data.religion : curr.religion},
                    sect = ${data.sect !== undefined ? data.sect : curr.sect},
                    caste = ${finalCaste !== undefined ? finalCaste : curr.caste},
                    willing_to_marry_other_caste = ${data.willingToMarryOtherCaste !== undefined ? data.willingToMarryOtherCaste : curr.willing_to_marry_other_caste},
                    horoscope = ${data.horoscope !== undefined ? data.horoscope : curr.horoscope},
                    star = ${data.star !== undefined ? data.star : curr.star},
                    time_of_birth = ${data.timeOfBirth !== undefined ? data.timeOfBirth : curr.time_of_birth},
                    place_of_birth = ${data.placeOfBirth !== undefined ? data.placeOfBirth : curr.place_of_birth},
                    dosham = ${data.dosham !== undefined ? data.dosham : curr.dosham},
                    country = ${data.country !== undefined ? data.country : curr.country},
                    working_country = ${data.workingCountry !== undefined ? data.workingCountry : curr.working_country},
                    visa_status = ${data.visaStatus !== undefined ? data.visaStatus : curr.visa_status},
                    state = ${data.state !== undefined ? data.state : curr.state},
                    city = ${data.city !== undefined ? data.city : curr.city},
                    residential_status = ${data.residentialStatus !== undefined ? data.residentialStatus : curr.residential_status},
                    education = ${data.education !== undefined ? data.education : curr.education},
                    employment_type = ${data.employmentType !== undefined ? data.employmentType : curr.employment_type},
                    occupation = ${data.occupation !== undefined ? data.occupation : curr.occupation},
                    organization_name = ${data.organizationName !== undefined ? data.organizationName : curr.organization_name},
                    currency = ${data.currency !== undefined ? data.currency : curr.currency},
                    income = ${data.income !== undefined ? data.income : curr.income},
                    extra_income = ${data.extraIncome !== undefined ? data.extraIncome : curr.extra_income},
                    job_details = ${data.jobDetails !== undefined ? data.jobDetails : curr.job_details},
                    property_type = ${data.propertyType !== undefined ? data.propertyType : curr.property_type},
                    financial_status = ${data.financialStatus !== undefined ? data.financialStatus : curr.financial_status},
                    diet = ${data.diet !== undefined ? data.diet : curr.diet},
                    smoking = ${data.smoking !== undefined ? data.smoking : curr.smoking},
                    drinking = ${data.drinking !== undefined ? data.drinking : curr.drinking},
                    family_type = ${data.familyType !== undefined ? data.familyType : curr.family_type},
                    family_status = ${data.familyStatus !== undefined ? data.familyStatus : curr.family_status},
                    family_income = ${data.familyIncome !== undefined ? data.familyIncome : curr.family_income},
                    father_name = ${data.fatherName !== undefined ? data.fatherName : curr.father_name},
                    father_status = ${data.fatherStatus !== undefined ? data.fatherStatus : curr.father_status},
                    father_occupation = ${data.fatherOccupation !== undefined ? data.fatherOccupation : curr.father_occupation},
                    mother_name = ${data.motherName !== undefined ? data.motherName : curr.mother_name},
                    mother_status = ${data.motherStatus !== undefined ? data.motherStatus : curr.mother_status},
                    mother_occupation = ${data.motherOccupation !== undefined ? data.motherOccupation : curr.mother_occupation},
                    elder_brother = ${data.elderBrother !== undefined ? data.elderBrother : curr.elder_brother},
                    married_elder_brother = ${data.marriedElderBrother !== undefined ? data.marriedElderBrother : curr.married_elder_brother},
                    younger_brother = ${data.youngerBrother !== undefined ? data.youngerBrother : curr.younger_brother},
                    married_younger_brother = ${data.marriedYoungerBrother !== undefined ? data.marriedYoungerBrother : curr.married_younger_brother},
                    elder_sister = ${data.elderSister !== undefined ? data.elderSister : curr.elder_sister},
                    married_elder_sister = ${data.marriedElderSister !== undefined ? data.marriedElderSister : curr.married_elder_sister},
                    younger_sister = ${data.youngerSister !== undefined ? data.youngerSister : curr.younger_sister},
                    married_younger_sister = ${data.marriedYoungerSister !== undefined ? data.marriedYoungerSister : curr.married_younger_sister},
                    family_living_in = ${data.familyLivingIn !== undefined ? data.familyLivingIn : curr.family_living_in},
                    aadhar_number = ${data.aadharNumber !== undefined ? data.aadharNumber : curr.aadhar_number},
                    temporary_address = ${data.temporaryAddress !== undefined ? data.temporaryAddress : curr.temporary_address},
                    permanent_address = ${data.permanentAddress !== undefined ? data.permanentAddress : curr.permanent_address},
                    about = ${data.about !== undefined ? data.about : curr.about},
                    partner_preference = ${data.partnerPreference !== undefined ? data.partnerPreference : curr.partner_preference},
                    photo = ${data.photo !== undefined ? data.photo : curr.photo},
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ${userId}
            `;
        }

        // Handle photo addition if provided as new base64
        if (data.photo && typeof data.photo === 'string' && data.photo.startsWith('data:image')) {
            try {
                await sql`UPDATE profile_photos SET is_main = false WHERE user_id = ${userId}`;
                await sql`
                    INSERT INTO profile_photos (user_id, photo_data, is_main)
                    VALUES (${userId}, ${data.photo}, true)
                `;
            } catch (pErr) {
                console.warn('Could not sync photo to profile_photos:', pErr.message);
            }
        }

        res.json({ success: true, message: 'User details updated successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Error updating user profile', error, 'Failed to update user');
    }
});

// 4.6.1 Upload photo for user
router.post('/users/:id/photos', async (req, res) => {
    try {
        const userId = req.params.id;
        const { photoData } = req.body;
        if (!photoData) {
            return res.status(400).json({ error: 'photoData is required' });
        }
        const existing = await sql`SELECT COUNT(*) as count FROM profile_photos WHERE user_id = ${userId}`;
        const isMain = parseInt(existing[0]?.count || 0) === 0;
        const inserted = await sql`
            INSERT INTO profile_photos (user_id, photo_data, is_main)
            VALUES (${userId}, ${photoData}, ${isMain})
            RETURNING id, photo_data, is_main
        `;
        if (isMain) {
            await sql`UPDATE profiles SET photo = ${photoData} WHERE user_id = ${userId}`;
        }
        res.json({ success: true, photo: inserted[0] });
    } catch (err) {
        return dbErrorResponse(res, 'Error uploading photo', err, 'Failed to upload photo');
    }
});

// 4.6.2 Set main photo
router.put('/users/:id/photos/:photoId/main', async (req, res) => {
    try {
        const { id: userId, photoId } = req.params;
        const photo = await sql`SELECT photo_data FROM profile_photos WHERE id = ${photoId} AND user_id = ${userId}`;
        if (photo.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        await sql`UPDATE profile_photos SET is_main = false WHERE user_id = ${userId}`;
        await sql`UPDATE profile_photos SET is_main = true WHERE id = ${photoId} AND user_id = ${userId}`;
        await sql`UPDATE profiles SET photo = ${photo[0].photo_data} WHERE user_id = ${userId}`;
        res.json({ success: true, message: 'Main photo updated' });
    } catch (err) {
        return dbErrorResponse(res, 'Error setting main photo', err, 'Failed to set main photo');
    }
});

// 4.6.3 Delete photo
router.delete('/users/:id/photos/:photoId', async (req, res) => {
    try {
        const { id: userId, photoId } = req.params;
        const target = await sql`SELECT is_main FROM profile_photos WHERE id = ${photoId} AND user_id = ${userId}`;
        if (target.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        await sql`DELETE FROM profile_photos WHERE id = ${photoId} AND user_id = ${userId}`;
        if (target[0].is_main) {
            const nextPhoto = await sql`SELECT id, photo_data FROM profile_photos WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 1`;
            if (nextPhoto.length > 0) {
                await sql`UPDATE profile_photos SET is_main = true WHERE id = ${nextPhoto[0].id}`;
                await sql`UPDATE profiles SET photo = ${nextPhoto[0].photo_data} WHERE user_id = ${userId}`;
            } else {
                await sql`UPDATE profiles SET photo = NULL WHERE user_id = ${userId}`;
            }
        }
        res.json({ success: true, message: 'Photo deleted' });
    } catch (err) {
        return dbErrorResponse(res, 'Error deleting photo', err, 'Failed to delete photo');
    }
});

// 4.7. Get batch of full user profiles for multi-profile download
router.post('/users/batch', async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds array is required' });
        }

        const numericIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (numericIds.length === 0) {
            return res.status(400).json({ error: 'Valid userIds are required' });
        }

        const users = await sql`
            SELECT 
                u.*,
                p.full_name, p.dob, p.dob_day, p.dob_month, p.dob_year,
                p.mother_tongue, p.height, p.physical_status, p.marital_status,
                p.religion, p.sect, p.caste, p.horoscope, p.time_of_birth, p.place_of_birth,
                p.country, p.working_country, p.state, p.city, p.residential_status,
                p.education, p.employment_type, p.occupation, p.income, p.organization_name,
                p.family_type, p.family_status, p.father_name, p.father_status, p.father_occupation,
                p.mother_name, p.mother_status, p.mother_occupation,
                p.elder_brother, p.younger_brother, p.elder_sister, p.younger_sister,
                p.diet, p.smoking, p.drinking, p.body_type, p.weight, p.about,
                p.partner_preference, p.photo
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ANY(${numericIds})
            ORDER BY u.created_at DESC
        `;

        res.json(users);
    } catch (error) {
        return dbErrorResponse(res, 'Error fetching batch users', error, 'Failed to fetch batch profiles');
    }
});

// 5. Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        await sql`DELETE FROM users WHERE id = ${userId}`;
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Error deleting user', error, 'Failed to delete user');
    }
});

// 6. Get story data
router.get('/stories', (req, res) => {
    try {
        const stories = readStories();
        res.json(stories);
    } catch (error) {
        console.error('Error reading stories:', error);
        res.status(500).json({ error: 'Failed to read story data' });
    }
});

// 7. Update story data (couple names and descriptions)
router.put('/stories', (req, res) => {
    try {
        const updates = req.body;
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ error: 'Invalid story data' });
        }

        const currentStories = readStories();

        // Merge updates into current stories
        for (const key of ['story1', 'story2', 'story3']) {
            if (updates[key]) {
                if (updates[key].coupleName !== undefined) {
                    currentStories[key].coupleName = updates[key].coupleName;
                }
                if (updates[key].description !== undefined) {
                    currentStories[key].description = updates[key].description;
                }
            }
        }

        writeStories(currentStories);
        res.json({ message: 'Stories updated successfully', stories: currentStories });
    } catch (error) {
        console.error('Error updating stories:', error);
        res.status(500).json({ error: 'Failed to update story data' });
    }
});

// 8. Get complete storage details (VPS storage + User Database space)
router.get('/storage', async (req, res) => {
    try {
        let vpsStorage = { total: 'N/A', used: 'N/A', available: 'N/A', usePercent: '0%' };
        // Get VPS Hard Drive usage
        if (process.platform === 'win32') {
            vpsStorage = { total: 'Windows Dev', used: 'N/A', available: 'N/A', usePercent: '0%' };
        } else {
            try {
                const { stdout } = await execPromise('df -h /');
                const lines = stdout.trim().split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].trim().split(/\s+/);
                    vpsStorage = {
                        total: parts[1],      // e.g., "48G"
                        used: parts[2],       // e.g., "3.1G"
                        available: parts[3],  // e.g., "45G"
                        usePercent: parts[4], // e.g., "7%"
                    };
                }
            } catch (fsError) {
                console.error('Error fetching OS storage:', fsError);
            }
        }

        // Get Database User Space usage (Profiles, images, info inside Postgres)
        let databaseStorage = { totalUserSpaceMB: '0.00' };
        let totalUsers = 0;
        
        try {
            // Postgres function gives exact byte size of the whole database
            const dbSizeResult = await sql`SELECT pg_database_size(current_database()) as size`;
            const usersResult = await sql`SELECT count(*) as total FROM users`;
            totalUsers = parseInt(usersResult[0].total) || 0;
            
            if (dbSizeResult && dbSizeResult[0]) {
                const bytes = parseInt(dbSizeResult[0].size);
                // Convert to MB with 2 decimal places
                const mb = (bytes / (1024 * 1024)).toFixed(2);
                databaseStorage.totalUserSpaceMB = mb;
            }
        } catch (dbError) {
            console.error('Error fetching DB storage:', dbError);
        }

        res.json({
            vpsStorage,
            databaseStorage,
            totalUsers
        });
    } catch (error) {
        console.error('Master storage fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch storage report' });
    }
});

export default router;
