// tests/testUtils.js
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import api from '../src/routes/index.js';
import { notFound, errorHandler } from '../src/middlewares/error.js';
import { requireAuth } from '../src/middlewares/auth.js'; // 👈 importa tu middleware

let mongod, currentDbPath;

export async function startMemoryMongo() {
  const version     = process.env.MONGOMS_VERSION || '6.0.12';
  const baseDbDir   = process.env.MONGOMS_TMP_DIR || path.join(os.tmpdir(), 'mongo-mem');
  const downloadDir = process.env.MONGOMS_DOWNLOAD_DIR || path.join(os.tmpdir(), 'mongo-binaries');

  currentDbPath = path.join(baseDbDir, `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(currentDbPath, { recursive: true });
  await fs.mkdir(downloadDir, { recursive: true });

  mongod = await MongoMemoryServer.create({
    binary: { version, downloadDir },
    instance: { dbName: 'testdb', storageEngine: 'wiredTiger', dbPath: currentDbPath }
  });

  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: 'testdb' });
}

export async function clearDB() {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
}

export async function stopMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  if (currentDbPath) await fs.rm(currentDbPath, { recursive: true, force: true });
}

export function createTestApp() {
  const app = express();
  app.use(express.json());

  // 👇 Ruta de laboratorio que usan los tests del middleware
  app.get('/t/protected', requireAuth, (req, res) => {
    res.json({ ok: true, email: req.user?.email });
  });

  app.use('/api', api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
