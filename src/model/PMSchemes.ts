import mongoose, { Schema, Document } from 'mongoose';

export interface IPMScheme extends Document {
    schemeName: string;
    description: string;
    benefitsDescription: string;
    eligibilityCriteria: string;
    requiredDocuments: string[];
    officialWebsite?: string;
}

const pmSchemeSchema = new Schema<IPMScheme>({
    schemeName: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    benefitsDescription: { type: String, required: true },
    eligibilityCriteria: { type: String, required: true },
    requiredDocuments: [{ 
        type: String, 
        enum: ['aadhaarCard', 'panCard', 'rationCard', 'voterId', 'kisanCreditCard', 'landRecords', 'bankPassbook'],
        required: true 
    }],
    officialWebsite: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model<IPMScheme>('PMScheme', pmSchemeSchema);
