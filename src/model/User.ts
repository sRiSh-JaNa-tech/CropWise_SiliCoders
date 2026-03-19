import mongoose, { Schema, Types, Document } from 'mongoose';

export interface IUser extends Document {
    userId: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    dob: Date;
    
    // Identity Documents required for PM Scheme Enrollment
    aadhaarCard: string;
    sixDigitPin: string; // Hashed
    panCard?: string;
    voterId?: string;
    rationCard?: string;
    kisanCreditCard?: string;
    bankPassbook?: string;
    landRecords?: string;

    // Agricultural Data
    landSizeAcres?: number;
    state?: string;
    district?: string;

    // PM Scheme Tracking
    enrolledSchemes: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    dob: { type: Date, required: true },
    
    // Essential Credentials
    aadhaarCard: { type: String, required: true, unique: true },
    sixDigitPin: { type: String, required: true },
    panCard: { type: String, default: null },
    voterId: { type: String, default: null },
    rationCard: { type: String, default: null },
    kisanCreditCard: { type: String, default: null },
    bankPassbook: { type: String, default: null },
    landRecords: { type: String, default: null },

    // Location & Scale
    landSizeAcres: { type: Number, default: 0 },
    state: { type: String, default: null },
    district: { type: String, default: null },

    enrolledSchemes: [{
        type: Schema.Types.ObjectId,
        ref: 'PMScheme'
    }]
}, { timestamps: true });

// Methods for schema manipulation can be added here if needed
// e.g., userSchema.methods.enrollInScheme = async function(schemeId) { ... }

export default mongoose.model<IUser>('User', userSchema);