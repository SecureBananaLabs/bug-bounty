import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  jobId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  coverLetter: string;
  bidAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const ProposalSchema: Schema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, required: true },
  bidAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const ProposalModel = mongoose.model<IProposal>('Proposal', ProposalSchema);
