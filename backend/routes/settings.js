import { Router } from 'express';
import bcrypt from 'bcryptjs';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// ============ CHANGE PASSWORD ============

// Verify current password
router.post('/verify-password', auth, async (req, res) => {
    try {
        const { currentPassword } = req.body;
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password is required' });
        }

        const users = await sql`SELECT password_hash FROM users WHERE id = ${req.user.id}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        res.json({ verified: true, message: 'Password verified successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Verify password error', error, 'Failed to verify password');
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password and confirm password do not match' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        // Verify current password
        const users = await sql`SELECT password_hash FROM users WHERE id = ${req.user.id}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await sql`UPDATE users SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP WHERE id = ${req.user.id}`;

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Change password error', error, 'Failed to change password');
    }
});

// ============ DEACTIVATE PROFILE ============

// Deactivate profile
router.post('/deactivate', auth, async (req, res) => {
    try {
        const { duration } = req.body; // e.g. '15_days', '1_month', '2_months', '3_months'

        if (!duration) {
            return res.status(400).json({ error: 'Please select a deactivation duration' });
        }

        // Calculate reactivation date
        const now = new Date();
        let reactivateAt;
        switch (duration) {
            case '15_days':
                reactivateAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
                break;
            case '1_month':
                reactivateAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                break;
            case '2_months':
                reactivateAt = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
                break;
            case '3_months':
                reactivateAt = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
                break;
            default:
                return res.status(400).json({ error: 'Invalid duration' });
        }

        // Upsert deactivation record
        const existing = await sql`SELECT id FROM deactivations WHERE user_id = ${req.user.id}`;
        if (existing.length > 0) {
            await sql`
                UPDATE deactivations 
                SET is_active = false, deactivated_at = CURRENT_TIMESTAMP, reactivate_at = ${reactivateAt.toISOString()}, duration = ${duration}
                WHERE user_id = ${req.user.id}
            `;
        } else {
            await sql`
                INSERT INTO deactivations (user_id, is_active, deactivated_at, reactivate_at, duration)
                VALUES (${req.user.id}, false, CURRENT_TIMESTAMP, ${reactivateAt.toISOString()}, ${duration})
            `;
        }

        res.json({ message: 'Profile deactivated successfully', reactivateAt: reactivateAt.toISOString() });
    } catch (error) {
        return dbErrorResponse(res, 'Deactivate error', error, 'Failed to deactivate profile');
    }
});

// Activate (reactivate) profile
router.post('/activate', auth, async (req, res) => {
    try {
        await sql`
            UPDATE deactivations 
            SET is_active = true, reactivate_at = NULL
            WHERE user_id = ${req.user.id}
        `;

        res.json({ message: 'Profile activated successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Activate error', error, 'Failed to activate profile');
    }
});

// Check deactivation status
router.get('/deactivation-status', auth, async (req, res) => {
    try {
        const results = await sql`
            SELECT is_active, deactivated_at, reactivate_at, duration 
            FROM deactivations 
            WHERE user_id = ${req.user.id}
        `;

        if (results.length === 0) {
            return res.json({ isDeactivated: false });
        }

        const record = results[0];

        // Check if auto-reactivation time has passed
        if (!record.is_active && record.reactivate_at && new Date(record.reactivate_at) <= new Date()) {
            await sql`UPDATE deactivations SET is_active = true, reactivate_at = NULL WHERE user_id = ${req.user.id}`;
            return res.json({ isDeactivated: false });
        }

        res.json({
            isDeactivated: !record.is_active,
            deactivatedAt: record.deactivated_at,
            reactivateAt: record.reactivate_at,
            duration: record.duration
        });
    } catch (error) {
        return dbErrorResponse(res, 'Deactivation status error', error, 'Failed to check deactivation status');
    }
});

// ============ DELETE PROFILE ============

router.post('/delete-profile', auth, async (req, res) => {
    try {
        const { reason, otherReason, confirmDelete } = req.body;

        if (!confirmDelete) {
            return res.status(400).json({ error: 'Please confirm profile deletion' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Please select a reason for deletion' });
        }

        const deleteReason = reason === 'Other reasons' ? (otherReason || 'Other reasons') : reason;

        // Permanently delete user — CASCADE will remove profiles, preferences, favourites, interests, shortlists, etc.
        await sql`DELETE FROM users WHERE id = ${req.user.id}`;

        res.json({ message: 'Profile deleted permanently' });
    } catch (error) {
        return dbErrorResponse(res, 'Delete profile error', error, 'Failed to delete profile');
    }
});

// ============ IGNORED PROFILES ============

// Get ignored profiles list
router.get('/ignored', auth, async (req, res) => {
    try {
        const results = await sql`
            SELECT i.id as ignore_id, i.created_at as ignored_at,
                   u.unique_id, p.full_name, p.photo, p.city, p.state, p.country,
                   p.religion, p.caste, p.education, p.occupation,
                   p.dob, p.height
            FROM ignores i
            JOIN users u ON u.id = i.ignored_user_id
            JOIN profiles p ON p.user_id = i.ignored_user_id
            WHERE i.user_id = ${req.user.id}
            ORDER BY i.created_at DESC
        `;

        const profiles = results.map(row => ({
            ignoreId: row.ignore_id,
            uniqueId: row.unique_id,
            fullName: row.full_name || 'Member',
            photo: row.photo || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            religion: row.religion || '',
            caste: row.caste || '',
            education: row.education || '',
            occupation: row.occupation || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            ignoredAt: row.ignored_at
        }));

        res.json(profiles);
    } catch (error) {
        return dbErrorResponse(res, 'Get ignored profiles error', error, 'Failed to get ignored profiles');
    }
});

// Remove from ignored list
router.delete('/ignored/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        await sql`
            DELETE FROM ignores 
            WHERE user_id = ${req.user.id} AND ignored_user_id = ${target[0].id}
        `;

        res.json({ message: 'Removed from ignored list' });
    } catch (error) {
        return dbErrorResponse(res, 'Remove ignored error', error, 'Failed to remove from ignored list');
    }
});

// ============ BLOCKED PROFILES ============

// Get blocked profiles list
router.get('/blocked', auth, async (req, res) => {
    try {
        const results = await sql`
            SELECT b.id as block_id, b.created_at as blocked_at,
                   u.unique_id, p.full_name, p.photo, p.city, p.state, p.country,
                   p.religion, p.caste, p.education, p.occupation,
                   p.dob, p.height
            FROM blocks b
            JOIN users u ON u.id = b.blocked_user_id
            JOIN profiles p ON p.user_id = b.blocked_user_id
            WHERE b.user_id = ${req.user.id}
            ORDER BY b.created_at DESC
        `;

        const profiles = results.map(row => ({
            blockId: row.block_id,
            uniqueId: row.unique_id,
            fullName: row.full_name || 'Member',
            photo: row.photo || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            religion: row.religion || '',
            caste: row.caste || '',
            education: row.education || '',
            occupation: row.occupation || '',
            age: row.dob ? Math.floor((new Date() - new Date(row.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            height: row.height || '',
            blockedAt: row.blocked_at
        }));

        res.json(profiles);
    } catch (error) {
        return dbErrorResponse(res, 'Get blocked profiles error', error, 'Failed to get blocked profiles');
    }
});

// Block a profile
router.post('/block/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        const targetId = target[0].id;
        if (targetId === req.user.id) return res.status(400).json({ error: "Can't block yourself" });

        const existing = await sql`SELECT id FROM blocks WHERE user_id = ${req.user.id} AND blocked_user_id = ${targetId}`;
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already blocked' });
        }

        await sql`
            INSERT INTO blocks (user_id, blocked_user_id)
            VALUES (${req.user.id}, ${targetId})
        `;

        res.json({ message: 'Profile blocked' });
    } catch (error) {
        return dbErrorResponse(res, 'Block error', error, 'Failed to block profile');
    }
});

// Remove from blocked list
router.delete('/blocked/:uniqueId', auth, async (req, res) => {
    try {
        const target = await sql`SELECT id FROM users WHERE unique_id = ${req.params.uniqueId}`;
        if (target.length === 0) return res.status(404).json({ error: 'User not found' });

        await sql`
            DELETE FROM blocks 
            WHERE user_id = ${req.user.id} AND blocked_user_id = ${target[0].id}
        `;

        res.json({ message: 'Removed from blocked list' });
    } catch (error) {
        return dbErrorResponse(res, 'Remove blocked error', error, 'Failed to remove from blocked list');
    }
});

export default router;
