import mongoose from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
  console.log('Database connected successfully');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('Database disconnected');
}
