import { generateFarmingPlan, PlannerInput, PlannerOutput } from '../../ai/plannerEngine.js';
import { SmartPlan } from '../../models/SmartPlan.js';

export class PlannerService {
  async generatePlan(input: PlannerInput): Promise<PlannerOutput> {
    // Allows easy integration with AI models in the future
    // Currently relying on rule-based extension
    const generatedPlan = generateFarmingPlan(input);
    
    try {
      const newPlan = new SmartPlan({
        ...input,
        ...generatedPlan
      });
      await newPlan.save();
      console.log('Plan successfully persisted to Database.');
    } catch (err) {
      console.error('Error saving to DB:', err);
    }

    return generatedPlan;
  }

  async getSavedPlans(): Promise<any[]> {
    try {
      return await SmartPlan.find().sort({ createdAt: -1 }).limit(10);
    } catch (err) {
      console.error('Error fetching plans from DB:', err);
      return [];
    }
  }
}
