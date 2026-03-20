import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    const MONGO_URL = process.env.MONGO_URL;
    if (!MONGO_URL) {
        console.error('MONGO_URL not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db!;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`\nCollection "${col.name}": ${count} documents`);
            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log(`Sample from "${col.name}":`, JSON.stringify(sample, null, 2));
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
