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
// Activa "permitir todo" temporalmente poniendo CORS_ALLOW_ALL=true en Azure
const ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';

// Lista de orígenes permitidos (separados por coma, sin / final)
const rawOrigins = (
  process.env.CORS_ORIGINS ||
  config?.corsOrigins ||
  ''
).split(',')
 .map(s => s.trim())
 .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isAllowed =
    ALLOW_ALL ||
    !origin ||                 // permite calls sin Origin (curl/health)
    rawOrigins.length === 0 || // si no configuraste orígenes, permite
    rawOrigins.includes(origin);

  if (isAllowed) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    else res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Origin');

    const reqMethod = req.headers['access-control-request-method'];
    res.setHeader('Access-Control-Allow-Methods', reqMethod || 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    const reqHeaders = req.headers['access-control-request-headers'];
    res.setHeader('Access-Control-Allow-Headers', reqHeaders || 'Content-Type, Authorization, X-Requested-With');

    if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // responde el preflight aquí mismo
  }

  next();
});

// ===== Logs (JSON-friendly para Azure) =====
app.use(morgan((tokens, req, res) => JSON.stringify({
  method: tokens.method(req, res),
  url: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  response_time_ms: Number(tokens['response-time'](req, res)),
  ip: req.ip
})));

// ===== Body parser + seguridad =====
app.use(express.json({ limit: '1mb' }));
app.use(...securityMiddleware);

// ===== Health / Ready =====
app.get('/health', (_req, res) => res.json({ ok: true, env: config.env, sha: config.buildSha }));
app.get('/ready',  (_req, res) => res.sendStatus(204));

// ===== API =====
app.use('/api', api);

// ===== CORS EN ERRORES (asegura header aun si truena la ruta) =====
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

// ===== 404 + errores =====
app.use(notFound);
app.use(errorHandler);

export default app;
