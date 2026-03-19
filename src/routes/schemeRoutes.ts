import express, { Request, Response } from 'express';
import PMScheme from '../model/PMSchemes.js';

const router = express.Router();

// Get all PM Schemes
router.get('/', async (req: Request, res: Response) => {
    try {
        const schemes = await PMScheme.find();
        res.json(schemes);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Get single scheme by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const scheme = await PMScheme.findById(req.params.id);
        if (!scheme) return res.status(404).json({ message: "Scheme not found" });
        res.json(scheme);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
