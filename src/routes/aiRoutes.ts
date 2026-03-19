/**
 * AI Routes — All AI endpoints consolidated into Express
 * Replaces the Python FastAPI server entirely.
 */
import express, { Request, Response } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { chatGraph } from '../services/ai/chatGraph.js';
import { autonomousAgent } from '../services/agent/workflow.js';
import { closeBrowser } from '../services/agent/browserTools.js';
import AgentTask from '../model/AgentTask.js';
import AgentLog from '../model/AgentLog.js';
import PageData from '../model/PageData.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Helper: retry on rate limits ───────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const msg = String(err);
            if ((msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && i < retries - 1) {
                const wait = (i + 1) * 6000;
                console.log(`Rate limited, retrying in ${wait / 1000}s...`);
                await new Promise(r => setTimeout(r, wait));
            } else {
                throw err;
            }
        }
    }
    throw new Error('Retry exhausted');
}

// ── POST /api/ai/chat — Text Chat ──────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { query, aadhaar, connectivity, location, dialect, image_data } = req.body;
        if (!query && !image_data) return res.status(400).json({ error: 'query or image is required' });

        const result = await withRetry(() => chatGraph.invoke({
            query: query || "What do you see in this image?",
            user_aadhaar: aadhaar || null,
            user_data: null,
            scheme_data: null,
            response: '',
            category: '',
            redirect: null,
            connectivity: connectivity || 'high',
            image_data: image_data || null,
            location: location || null,
            dialect: dialect || 'English',
        }));

        res.json({ response: result.response, category: result.category, redirect: result.redirect });
    } catch (err: any) {
        console.error('Chat error:', err.message);
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({ error: 'AI model rate limit exceeded. Try again shortly.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/ai/audio-chat — Voice Chat ────────────────────────────────────
router.post('/audio-chat', upload.single('audio'), async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'audio file required' });
        
        const { aadhaar, connectivity, location, dialect } = req.body;

        // 1. Transcribe using OpenAI Whisper
        const file = new File([new Uint8Array(req.file.buffer)], 'audio.wav', { type: 'audio/wav' });
        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file,
        });
        const userText = transcription.text.trim();
        console.log('Transcribed:', userText);

        // 2. Process with chat graph
        const result = await withRetry(() => chatGraph.invoke({
            query: userText,
            user_aadhaar: aadhaar || null,
            user_data: null,
            scheme_data: null,
            response: '',
            category: '',
            redirect: null,
            connectivity: connectivity || 'high',
            image_data: null,
            location: location ? JSON.parse(location) : null,
            dialect: dialect || 'English',
        }));

        res.json({ user_text: userText, response: result.response, category: result.category, redirect: result.redirect });
    } catch (err: any) {
        console.error('Audio-chat error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/ai/tasks/browse — Autonomous Browsing ────────────────────────
router.post('/tasks/browse', async (req: Request, res: Response) => {
    try {
        const { goal, startUrl } = req.body;
        if (!goal) return res.status(400).json({ error: 'goal is required' });

        const task = await AgentTask.create({
            taskDescription: goal,
            taskType: 'browse',
            status: 'pending',
            startUrl: startUrl || null,
        });

        // Run in background
        const taskId = String(task._id);
        setImmediate(async () => {
            try {
                await AgentTask.findByIdAndUpdate(taskId, { status: 'active' });
                const fullGoal = startUrl ? `${goal}. Start at: ${startUrl}` : goal;

                await autonomousAgent.invoke({
                    taskId,
                    originalTask: fullGoal,
                    plan: [],
                    currentStep: 0,
                    pastSteps: [],
                    currentUrl: startUrl || '',
                    pageTitle: '',
                    pageContent: '',
                    pageElements: {},
                    status: 'started',
                    finalResponse: '',
                    iteration: 0,
                });

                await closeBrowser();
            } catch (err: any) {
                console.error('Agent error:', err.message);
                await AgentTask.findByIdAndUpdate(taskId, { status: 'failed', result: err.message });
                await closeBrowser();
            }
        });

        res.json({ task_id: taskId, status: 'started' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/tasks/status/:id ────────────────────────────────────────────
router.get('/tasks/status/:id', async (req: Request, res: Response) => {
    try {
        const task = await AgentTask.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({
            task_id: String(task._id),
            status: task.status,
            result: task.result,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/tasks/logs/:id ──────────────────────────────────────────────
router.get('/tasks/logs/:id', async (req: Request, res: Response) => {
    try {
        const logs = await AgentLog.find({ taskId: req.params.id }).sort({ createdAt: 1 });
        res.json({ task_id: req.params.id, logs: logs.map(l => ({
            node: l.nodeName,
            action: l.action,
            result: l.result?.slice(0, 500),
        }))});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/tasks/pages/:id ─────────────────────────────────────────────
router.get('/tasks/pages/:id', async (req: Request, res: Response) => {
    try {
        const pages = await PageData.find({ taskId: req.params.id }).sort({ createdAt: 1 });
        res.json({ task_id: req.params.id, pages: pages.map(p => ({
            url: p.url,
            title: p.title,
            headings: p.headings,
            linksCount: p.linksCount,
            formsCount: p.formsCount,
        }))});
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
