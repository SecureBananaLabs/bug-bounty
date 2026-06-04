import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  clientId: mongoose.Types.ObjectId;
  budget: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

export const JobModel = mongoose.model<IJob>('Job', JobSchema);
