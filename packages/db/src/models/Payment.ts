import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  jobId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
