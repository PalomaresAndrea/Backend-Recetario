// src/config/db.js
import mongoose from 'mongoose';
import { config } from './env.js';

export const dbState = {
  connected: false,
  lastError: null,
};

export async function connectDB({ retries = 10, intervalMs = 5000 } = {}) {
  const uri = (config.mongoUri || '').trim();

  if (!uri) {
    dbState.connected = false;
    dbState.lastError = new Error('MONGO_URI no definido en App Settings/Secrets');
    console.error('⚠️', dbState.lastError.message);
    return; // No bloquees el arranque; /health seguirá respondiendo.
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      await conn.connection.db.admin().ping();
      dbState.connected = true;
      dbState.lastError = null;
      console.log(`✅ MongoDB conectado (host: ${conn.connection.host}, db: ${conn.connection.name})`);
      return;
    } catch (e) {
      dbState.connected = false;
      dbState.lastError = e;
      console.error(`❌ Mongo intento ${i + 1}/${retries + 1} falló:`, e?.message || e);
      if (i < retries) await new Promise(r => setTimeout(r, intervalMs));
    }
  }
}
