import express from 'express';
import morgan from 'morgan';
import { securityMiddleware } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';
import api from './routes/index.js';
import { config } from './config/env.js';

const app = express();

// Logs (formato JSON friendly para Azure)
app.use(morgan((tokens, req, res) => JSON.stringify({
  method: tokens.method(req, res),
  url: tokens.url(req, res),
  status: Number(tokens.status(req, res)),
  response_time_ms: Number(tokens['response-time'](req, res)),
  ip: req.ip
})));

// Seguridad y parsing
app.use(express.json({ limit: '1mb' }));
app.use(...securityMiddleware);

// Health / Ready
app.get('/health', (_req, res) => res.json({ ok: true, env: config.env, sha: config.buildSha }));
app.get('/ready',  (_req, res) => res.sendStatus(204));

// API
app.use('/api', api);

// 404 + errores
app.use(notFound);
app.use(errorHandler);

export default app;
