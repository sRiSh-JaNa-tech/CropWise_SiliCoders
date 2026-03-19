import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);

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

// ─── Tanya Dashboard Weather API ───
app.use('/api/tanya', tanyaWeatherRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api', translationRoutes);

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React app for client-side routing
app.use((req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

export default app;

