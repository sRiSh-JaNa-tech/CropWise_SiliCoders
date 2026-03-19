import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentLog extends Document {
    taskId: mongoose.Types.ObjectId;
    nodeName: string;
    action: string;
    result: string;
}

const agentLogSchema = new Schema<IAgentLog>({
    taskId: { type: Schema.Types.ObjectId, ref: 'AgentTask', required: true },
    nodeName: { type: String, required: true },
    action: { type: String, required: true },
    result: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IAgentLog>('AgentLog', agentLogSchema);
