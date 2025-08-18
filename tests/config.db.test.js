// tests/config.db.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';

describe('config/db connectDB', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('cuando no hay MONGO_URI, no lanza, marca estado y retorna', async () => {
    process.env.MONGO_URI = '';
    const { connectDB, dbState } = await import('../src/config/db.js');
    await connectDB({ retries: 0 });
    expect(dbState.connected).toBe(false);
    expect(dbState.lastError).toBeInstanceOf(Error);
  });

  it('reintenta y finalmente conecta (simulado)', async () => {
    process.env.MONGO_URI = 'mongodb://fake:27017/db';
    const mongoose = { 
      connect: vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue({ connection: { host:'x', name:'y', db:{ admin: () => ({ ping: () => Promise.resolve() }) } } })
    };
    vi.doMock('mongoose', () => ({ default: mongoose }));

    const { connectDB, dbState } = await import('../src/config/db.js');
    await connectDB({ retries: 1, intervalMs: 1 });
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
    expect(dbState.connected).toBe(true);
    expect(dbState.lastError).toBeNull();
  });

  it('si agota reintentos, deja lastError y connected=false', async () => {
    process.env.MONGO_URI = 'mongodb://fake:27017/db';
    const mongoose = { connect: vi.fn().mockRejectedValue(new Error('boom')) };
    vi.doMock('mongoose', () => ({ default: mongoose }));

    const { connectDB, dbState } = await import('../src/config/db.js');
    await connectDB({ retries: 2, intervalMs: 1 });
    expect(mongoose.connect).toHaveBeenCalledTimes(3);
    expect(dbState.connected).toBe(false);
    expect(dbState.lastError).toBeInstanceOf(Error);
  });
});
