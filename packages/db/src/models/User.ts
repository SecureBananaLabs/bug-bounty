import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'client' | 'freelancer';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'freelancer'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
