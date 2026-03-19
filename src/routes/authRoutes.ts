import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/User.js';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, phone, dob, aadhaarCard, sixDigitPin } = req.body;

        // Validation for 6-digit pin
        if (!/^\d{6}$/.test(sixDigitPin)) {
            return res.status(400).json({ message: "PIN must be exactly 6 digits." });
        }

        const existingUser = await User.findOne({ aadhaarCard });
        if (existingUser) {
            return res.status(400).json({ message: "Aadhaar number already registered." });
        }

        const hashedPin = await bcrypt.hash(sixDigitPin, 10);
        
        const newUser = new User({
            name,
            email,
            phone,
            dob: new Date(dob),
            aadhaarCard,
            sixDigitPin: hashedPin
        });

        await newUser.save();
        
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
        res.status(201).json({ token, user: { name: newUser.name, aadhaarCard: newUser.aadhaarCard } });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { aadhaarCard, sixDigitPin } = req.body;

        const user = await User.findOne({ aadhaarCard });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(sixDigitPin, user.sixDigitPin);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid PIN." });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
        
        // Calculate missing documents (reminder logic)
        const requiredDocs = ['panCard', 'voterId', 'rationCard', 'kisanCreditCard', 'bankPassbook', 'landRecords'];
        const missingDocs = requiredDocs.filter(doc => !user[doc as keyof typeof user]);

        res.json({ 
            token, 
            user: { 
                name: user.name, 
                aadhaarCard: user.aadhaarCard,
                missingDocs 
            } 
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Get Me (Auth Middleware would be used here in a full app)
router.get('/me', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const requiredDocs = ['panCard', 'voterId', 'rationCard', 'kisanCreditCard', 'bankPassbook', 'landRecords'];
        const missingDocs = requiredDocs.filter(doc => !user[doc as keyof typeof user]);

        res.json({ 
            user: { 
                name: user.name, 
                aadhaarCard: user.aadhaarCard,
                missingDocs 
            } 
        });
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
});

export default router;
