import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isQuotaError } from './utils/dbError.js';
import setupDatabase from './schema.js';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import preferencesRoutes from './routes/preferences.js';
import searchRoutes from './routes/search.js';
import interestsRoutes from './routes/interests.js';
import matchesRoutes from './routes/matches.js';
import favouritesRoutes from './routes/favourites.js';
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure essential directories exist
const uploadDirs = ['uploads', 'uploads/profiles'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Middleware
app.use(cors());
app.use(compression()); // Gzip compression to reduce payload size massively
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Prevent aggressive caching for dynamic API responses
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interests', interestsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/favourites', favouritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (isQuotaError(err)) {
        console.warn(`⚠️ Unhandled DB quota error at ${req.method} ${req.path}`);
        return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
    }
    console.error('Unhandled error at', req.method, req.path, '-', err.message || err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Setup database tables
        await setupDatabase();
        console.log('✅ Database setup complete');

        app.listen(PORT, () => {
            console.log(`\n🚀 Matrimony backend running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
