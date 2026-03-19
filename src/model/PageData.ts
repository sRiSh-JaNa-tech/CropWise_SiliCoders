import mongoose, { Schema, Document } from 'mongoose';

export interface IPageData extends Document {
    taskId: mongoose.Types.ObjectId;
    url: string;
    title: string;
    headings: { tag: string; text: string }[];
    linksCount: number;
    formsCount: number;
    analysis: string;
}

const pageDataSchema = new Schema<IPageData>({
    taskId: { type: Schema.Types.ObjectId, ref: 'AgentTask', required: true },
    url: { type: String, required: true },
    title: { type: String, default: '' },
    headings: [{ tag: String, text: String }],
    linksCount: { type: Number, default: 0 },
    formsCount: { type: Number, default: 0 },
    analysis: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IPageData>('PageData', pageDataSchema);
