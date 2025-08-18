// tests/auth.routes.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startMemoryMongo, stopMemoryMongo, clearDB, createTestApp } from './testUtils.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.MAIL_DISABLED = 'true';

describe('routes/auth', () => {
  let app;
  beforeAll(async () => { await startMemoryMongo(); app = createTestApp(); });
  beforeEach(async () => { await clearDB(); });
  afterAll(async () => { await stopMemoryMongo(); });

  it('register: crea usuario y devuelve token (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'a@a.com', password: 'Secret123', name: 'Ana'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('a@a.com');
    expect(res.body.token).toBeTruthy();
  });

  it('login: credenciales inválidas (401)', async () => {
    // primero crea registro
    await request(app).post('/api/auth/register').send({ email:'a@a.com', password:'Secret123', name:'Ana' });
    const res = await request(app).post('/api/auth/login').send({ email:'a@a.com', password:'bad' });
    expect(res.status).toBe(401);
  });

  it('login: ok y luego /me protegido (200)', async () => {
    await request(app).post('/api/auth/register').send({ email:'a@a.com', password:'Secret123', name:'Ana' });
    const login = await request(app).post('/api/auth/login').send({ email:'a@a.com', password:'Secret123' });
    const token = login.body.token;

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('a@a.com');
  });

  it('register: conflicto si email ya existe (409)', async () => {
    await request(app).post('/api/auth/register').send({ email:'dup@x.com', password:'123456', name:'X' });
    const res = await request(app).post('/api/auth/register').send({ email:'dup@x.com', password:'123456', name:'Y' });
    expect(res.status).toBe(409);
  });
});
