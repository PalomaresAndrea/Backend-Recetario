// tests/auth.middleware.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startMemoryMongo, stopMemoryMongo, clearDB, createTestApp } from './testUtils.js';
import { requireAuth, signToken } from '../src/middlewares/auth.js';
import { Router } from 'express';
import { seedUser } from './seed.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

describe('middlewares/auth', () => {
  let app, user, token;

  beforeAll(async () => {
    await startMemoryMongo();
    app = createTestApp();

    // ruta protegida de prueba
    const r = Router();
    r.get('/protected', requireAuth, (req, res) => res.json({ ok: true, email: req.user.email }));
    app.use('/t', r);
  });

  beforeEach(async () => {
    await clearDB();
    user = await seedUser();
    token = signToken(user);
  });

  afterAll(async () => { await stopMemoryMongo(); });

  it('rechaza sin token (401)', async () => {
    const res = await request(app).get('/t/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No token|Invalid token/i);
  });

  it('rechaza token inválido (401)', async () => {
    const res = await request(app).get('/t/protected').set('Authorization', 'Bearer XXX.YYY.ZZZ');
    expect(res.status).toBe(401);
  });

  it('acepta token válido y adjunta req.user', async () => {
    const res = await request(app).get('/t/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.email).toBe(user.email);
  });

  it('rechaza token válido si el usuario ya no existe (401)', async () => {
    // borra usuario y usa el mismo token
    await user.deleteOne();
    const res = await request(app).get('/t/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/User not found/i);
  });
});
