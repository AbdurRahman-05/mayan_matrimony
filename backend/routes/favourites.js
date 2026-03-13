import { Router } from 'express';
import sql from '../db.js';
import auth from '../middleware/auth.js';
import { dbErrorResponse } from '../utils/dbError.js';

const router = Router();

// Get favourites
router.get('/', auth, async (req, res) => {
    try {
        const results = await sql`
      SELECT * FROM user_favourites WHERE user_id = ${req.user.id}
    `;

        if (results.length === 0) {
            return res.json({
                hobbies: [], sports: [], movies: [], read: [], tvShows: [], destinations: []
            });
        }

        const row = results[0];
        res.json({
            hobbies: row.hobbies || [],
            sports: row.sports || [],
            movies: row.movies || [],
            read: row.reading || [],
            tvShows: row.tv_shows || [],
            destinations: row.destinations || []
        });
    } catch (error) {
        return dbErrorResponse(res, 'Get favourites error', error, 'Failed to get favourites');
    }
});

// Update favourites
router.put('/', auth, async (req, res) => {
    try {
        const data = req.body;

        const existing = await sql`SELECT id FROM user_favourites WHERE user_id = ${req.user.id}`;

        if (existing.length === 0) {
            await sql`
        INSERT INTO user_favourites (user_id, hobbies, sports, movies, reading, tv_shows, destinations)
        VALUES (
          ${req.user.id},
          ${data.hobbies || []},
          ${data.sports || []},
          ${data.movies || []},
          ${data.read || []},
          ${data.tvShows || []},
          ${data.destinations || []}
        )
      `;
        } else {
            await sql`
        UPDATE user_favourites SET
          hobbies = ${data.hobbies || []},
          sports = ${data.sports || []},
          movies = ${data.movies || []},
          reading = ${data.read || []},
          tv_shows = ${data.tvShows || []},
          destinations = ${data.destinations || []},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${req.user.id}
      `;
        }

        res.json({ message: 'Favourites updated successfully' });
    } catch (error) {
        return dbErrorResponse(res, 'Update favourites error', error, 'Failed to update favourites');
    }
});

export default router;
