// src/config/db.js
import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  const uri = (config.mongoUri || '').trim();
  if (!uri) throw new Error('MONGO_URI no definido en .env / App Settings');

  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    throw new Error('MONGO_URI debe iniciar con "mongodb+srv://" (Atlas) o "mongodb://"');
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    await conn.connection.db.admin().ping();
    console.log(`✅ MongoDB conectado (host: ${conn.connection.host}, db: ${conn.connection.name})`);
  } catch (e) {
    console.error('❌ Error conectando a MongoDB:', e?.message || e);
    throw e;
  }
}
