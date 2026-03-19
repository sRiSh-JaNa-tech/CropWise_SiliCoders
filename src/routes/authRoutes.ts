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
        res.status(201).json({ 
            token, 
            user: { 
                name: newUser.name, 
                aadhaarCard: newUser.aadhaarCard,
                enrolledSchemes: []
            } 
        });
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
                missingDocs,
                enrolledSchemes: user.enrolledSchemes
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
                missingDocs,
                enrolledSchemes: user.enrolledSchemes
            } 
        });
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
});

// Enroll in a scheme
router.post('/enroll', async (req: Request, res: Response) => {
    try {
        const { schemeId } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.enrolledSchemes.includes(schemeId as any)) {
            user.enrolledSchemes.push(schemeId as any);
            await user.save();
        }

        res.json({ 
            message: "Enrolled successfully", 
            enrolledSchemes: user.enrolledSchemes 
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Update Profile / Documents
router.post('/update-profile', async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const { panCard, voterId, rationCard, kisanCreditCard, bankPassbook, landRecords, landSizeAcres, state, district } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update fields
        if (panCard !== undefined) user.panCard = panCard;
        if (voterId !== undefined) user.voterId = voterId;
        if (rationCard !== undefined) user.rationCard = rationCard;
        if (kisanCreditCard !== undefined) user.kisanCreditCard = kisanCreditCard;
        if (bankPassbook !== undefined) user.bankPassbook = bankPassbook;
        if (landRecords !== undefined) user.landRecords = landRecords;
        if (landSizeAcres !== undefined) user.landSizeAcres = landSizeAcres;
        if (state !== undefined) user.state = state;
        if (district !== undefined) user.district = district;

        await user.save();

        const requiredDocs = ['panCard', 'voterId', 'rationCard', 'kisanCreditCard', 'bankPassbook', 'landRecords'];
        const missingDocs = requiredDocs.filter(doc => !user[doc as keyof typeof user]);

        res.json({ 
            message: "Profile updated successfully", 
            user: { 
                name: user.name, 
                aadhaarCard: user.aadhaarCard,
                missingDocs,
                enrolledSchemes: user.enrolledSchemes,
                // Return updated fields too for UI
                panCard: user.panCard,
                voterId: user.voterId,
                rationCard: user.rationCard,
                kisanCreditCard: user.kisanCreditCard,
                bankPassbook: user.bankPassbook,
                landRecords: user.landRecords,
                landSizeAcres: user.landSizeAcres,
                state: user.state,
                district: user.district
            } 
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
