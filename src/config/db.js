// src/config/db.js
import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  const uri = (config.mongoUri || '').trim();

  if (!uri) {
    throw new Error('MONGO_URI no definido en .env');
  }
  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    throw new Error('MONGO_URI debe iniciar con "mongodb+srv://" (Atlas) o "mongodb://"');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // retryWrites, etc. ya van en la URI si usas Atlas
    });
    const c = mongoose.connection;
    console.log(`✅ MongoDB conectado (host: ${c.host}, db: ${c.name})`);
  } catch (e) {
    console.error('❌ Error conectando a MongoDB:', e?.message || e);
    throw e;
  }
}
