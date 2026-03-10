import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error at', req.method, req.path);
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
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
