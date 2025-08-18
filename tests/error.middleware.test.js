// tests/error.middleware.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { notFound, errorHandler } from '../src/middlewares/error.js';

describe('middlewares/error', () => {
  it('notFound devuelve 404 con payload esperado', async () => {
    const app = express();
    app.use(notFound);
    const res = await request(app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Not Found/i);
  });

  it('errorHandler formatea error 500', async () => {
    const app = express();
    app.get('/boom', () => { throw new Error('X'); });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('X');
    expect(res.body.code).toBe(500);
  });

  it('errorHandler respeta err.status personalizado', async () => {
    const app = express();
    app.get('/custom', (req, res, next) => { const e = new Error('Bad'); e.status = 400; next(e); });
    app.use(errorHandler);

    const res = await request(app).get('/custom');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad');
  });
});

