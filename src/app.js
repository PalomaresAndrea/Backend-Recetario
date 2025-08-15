// src/app.js
import express from 'express';
import morgan from 'morgan';
import { securityMiddleware } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';
import api from './routes/index.js';
import { config } from './config/env.js';

const app = express();
app.set('trust proxy', 1);

// ===== CORS GUARD (ANTES DE TODO) =====
const ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';
const rawOrigins = (process.env.CORS_ORIGINS || config?.corsOrigins || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = ALLOW_ALL || !origin || rawOrigins.length === 0 || rawOrigins.includes(origin);

  if (isAllowed) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    else res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Origin');

    const reqMethod  = req.headers['access-control-request-method'];
    const reqHeaders = req.headers['access-control-request-headers'];

    res.setHeader('Access-Control-Allow-Methods', reqMethod || 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', reqHeaders || 'Content-Type, Authorization, X-Requested-With');
    if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Logs
app.use(morgan((tokens, req, res) => JSON.stringify({
  method: tokens.method(req, res),
  url: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  response_time_ms: Number(tokens['response-time'](req, res)),
  ip: req.ip
})));

// Body + seguridad
app.use(express.json({ limit: '1mb' }));
app.use(...securityMiddleware);

// ===== Health / Ready =====
// /health SIEMPRE 200: indica si la API responde y cómo va la DB
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    env: config.env,
    sha: config.buildSha,
    db: (res.app?.locals?.dbReady ? 'up' : 'down')
  });
});

// /ready SOLO 204 cuando la DB esté conectada; si no, 503
app.get('/ready', (req, res) => {
  if (req.app?.locals?.dbReady) return res.sendStatus(204);
  return res.status(503).json({ error: 'db not ready' });
});

// API
app.use('/api', api);

// CORS en errores (garantiza header aunque haya 500)
app.use((err, req, res, next) => {
  if (!res.headersSent) {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  next(err);
});

// 404 + errores
app.use(notFound);
app.use(errorHandler);

export default app;
