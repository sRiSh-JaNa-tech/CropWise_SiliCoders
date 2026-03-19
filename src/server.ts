import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5280;
const MONGO_URI = process.env.MONGO_URL || process.env.DB_URI || 'mongodb://127.0.0.1:27017/cropwise_planner';

// Start server immediately to serve API routes (like Translation) even if DB is down
app.listen(PORT, () => {
    console.log(`AgriCrop Server initialized on http://localhost:${PORT}`);
});

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('MongoDB successfully connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Running in Fallback mode without Database (Offline features enabled)');
  });
