import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from '../db.js';

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
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
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
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 4. Admin Login
router.post('/login', (req, res) => {
    const { id, password } = req.body;
    // Hardcoded credentials for now since we don't have an admin table
    if (id === 'srimayan2000@gmail.com' && password === 'srimayan@1234') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid ID or Password' });
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
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
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
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
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
