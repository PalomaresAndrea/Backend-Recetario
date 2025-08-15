// src/app.js
import express from 'express';
import morgan from 'morgan';
import cors from 'cors'; // puedes dejarlo importado (lo usamos como respaldo opcional)
import { securityMiddleware } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';
import api from './routes/index.js';
import { config } from './config/env.js';

const app = express();
app.set('trust proxy', 1);

// ===== CORS GUARD (ANTES DE TODO) =====
// Lee orígenes permitidos de env/config (lista separada por comas)
const rawOrigins = (
  process.env.CORS_ORIGINS ||
  config?.corsOrigins ||
  ''
).split(',')
 .map(s => s.trim())
 .filter(Boolean);

// Middleware que SIEMPRE añade los headers CORS y responde el preflight
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed =
    !origin ||               // permite requests sin Origin (curl/health)
    rawOrigins.length === 0 || // si no configuraste orígenes, permite
    rawOrigins.includes(origin);

  if (isAllowed) {
    // Importante: si usas credenciales, NO uses '*'
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    else res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Vary', 'Origin');

    // Métodos permitidos
    const reqMethod = req.headers['access-control-request-method'];
    res.setHeader(
      'Access-Control-Allow-Methods',
      reqMethod ? reqMethod : 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );

    // Encabezados permitidos (refleja lo solicitado en el preflight si existe)
    const reqHeaders = req.headers['access-control-request-headers'];
    res.setHeader(
      'Access-Control-Allow-Headers',
      reqHeaders ? reqHeaders : 'Content-Type, Authorization, X-Requested-With'
    );

    // Si usas Authorization/cookies
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Cachea la respuesta del preflight
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Responder preflight aquí MISMO
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
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

// ===== 404 + errores =====
app.use(notFound);
app.use(errorHandler);

export default app;
