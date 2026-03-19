import { Request, Response } from 'express';
import { PlannerService } from '../services/smartPlanner/plannerService.js';
import { PlannerInput } from '../ai/plannerEngine.js';

const plannerService = new PlannerService();

export const generatePlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const input: PlannerInput = req.body;
    
    if (!input.cropType || !input.sowingDate) {
      return res.status(400).json({ error: 'Missing required fields: cropType and sowingDate are required.' });
    }

    const plan = await plannerService.generatePlan(input);
    return res.status(200).json(plan);
  } catch (error) {
    console.error('Error generating plan:', error);
    return res.status(500).json({ error: 'Failed to generate farming plan.' });
  }
};

export const getPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const plans = await plannerService.getSavedPlans();
    return res.status(200).json(plans);
  } catch (error) {
    console.error('Error retrieving plans:', error);
    return res.status(500).json({ error: 'Failed to retrieve plans.' });
  }
};
