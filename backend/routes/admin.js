import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from '../db.js';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { dbErrorResponse } from '../utils/dbError.js';

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

// 3. Get all registered users
router.get('/users', async (req, res) => {
    try {
        const users = await sql`
            SELECT 
                u.id as user_id, 
                COALESCE(p.full_name, 'N/A') as first_name, 
                '' as last_name, 
                COALESCE(u.email, 'No Email') as email, 
                COALESCE(u.mobile, 'No Phone') as phone, 
                COALESCE(u.gender, 'Not Specified') as gender, 
                COALESCE(p.religion, 'Not Specified') as religion,
                u.created_at 
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ORDER BY u.created_at ASC
        `;
        res.json(users);
    } catch (error) {
        return dbErrorResponse(res, 'Error fetching users', error, 'Failed to fetch users');
    }
});

// 4. Admin Login
router.post('/login', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (!id || !password) {
            return res.status(400).json({ success: false, error: 'ID and Password are required' });
        }

        const admins = await sql`SELECT * FROM admin_settings WHERE email = ${id}`;
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
        const photos = await sql`SELECT photo_data, is_main FROM profile_photos WHERE user_id = ${userId}`;

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

export default router;
