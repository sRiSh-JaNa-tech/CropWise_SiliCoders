import app from './app';
import dotenv from './dotenv';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AgriCrop Server running on http://localhost:${PORT}`);
});
