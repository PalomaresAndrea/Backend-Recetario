import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('✅ MongoDB conectado');
}

export async function closeDB() {
  await mongoose.connection.close();
}
