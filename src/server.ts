import app from './app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const PORT = process.env.PORT || 5000;
const DB_URI = process.env.DB_URI || 'mongodb://127.0.0.1:27017/cropwise_planner';

// Start server immediately to serve API routes (like Translation) even if DB is down
app.listen(PORT, () => {
    console.log(`AgriCrop Server initialized on http://localhost:${PORT}`);
});

mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('MongoDB successfully connected to: ' + DB_URI);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Running in Fallback mode without Database (IndexedDB offline mode takes over)');
  });
