import { Router } from 'express';
import { generatePlan, getPlans } from '../controllers/plannerController.js';

const router = Router();

router.post('/generate-plan', generatePlan);
router.get('/plans', getPlans);

export default router;
