import mongoose, { Schema, Document } from 'mongoose';

export interface ISmartPlan extends Document {
  cropType: string;
  soilType: string;
  location: string;
  farmSize: string;
  sowingDate: Date;
  irrigationType: string;
  weeklyPlan: any[];
  monthlyPlan: any[];
  eventList: any[];
  createdAt: Date;
}

const SmartPlanSchema: Schema = new Schema({
  cropType: { type: String, required: true },
  soilType: { type: String, required: true },
  location: { type: String, required: true },
  farmSize: { type: String, required: true },
  sowingDate: { type: Date, required: true },
  irrigationType: { type: String, required: true },
  weeklyPlan: { type: Array, required: true },
  monthlyPlan: { type: Array, required: true },
  eventList: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const SmartPlan = mongoose.model<ISmartPlan>('SmartPlan', SmartPlanSchema);
