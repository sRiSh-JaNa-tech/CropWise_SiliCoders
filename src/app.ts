import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mongoose from 'mongoose';
import tanyaWeatherRoutes from './tanya-dashboard/api/weatherRoutes.js';

// Setup for ES Modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import plannerRoutes from './routes/plannerRoutes.js';
import translationRoutes from './routes/translationRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ─── Logging Middleware ───
app.use((req: Request, res: Response, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] DEBUG: Incoming ${req.method} ${req.path}`);
    if (req.path === '/api/debug-ping') {
        return res.json({ 
            debug: 'pong', 
            server_time: new Date().toISOString(),
            active_routes: ['/api/auth/enroll', '/api/auth/update-profile']
        });
    }
    next();
});

// ─── Priority API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tanya', tanyaWeatherRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api', translationRoutes);


// ─── MongoDB Connection ───
const MONGO_URL = process.env.MONGO_URL;
if (MONGO_URL) {
  mongoose.connect(MONGO_URL)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err.message));
} else {
  console.warn('⚠️  MONGO_URL not set in .env — weather data will not be persisted');
}

// API Endpoints
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'AgriCrop server is perfectly integrated and healthy!' });
});


// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React app for client-side routing
app.use((req: Request, res: Response) => {
    // If it's an API request that didn't match, return 404 JSON
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `API route ${req.path} not found` });
    }
    // Otherwise serve the frontend
    res.sendFile(path.join(distPath, 'index.html'));
});

export default app;

