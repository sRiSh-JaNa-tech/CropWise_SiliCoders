import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentTask extends Document {
    taskDescription: string;
    taskType: string;
    status: string;
    startUrl?: string;
    result?: string;
}

const agentTaskSchema = new Schema<IAgentTask>({
    taskDescription: { type: String, required: true },
    taskType: { type: String, default: 'general' },
    status: { type: String, default: 'pending', enum: ['pending', 'active', 'completed', 'failed'] },
    startUrl: { type: String, default: null },
    result: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model<IAgentTask>('AgentTask', agentTaskSchema);
