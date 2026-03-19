import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5280;
const MONGO_URI = process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URL is not defined in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB SUCCESS');
    app.listen(PORT, () => {
      console.log(`AgriCrop Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
