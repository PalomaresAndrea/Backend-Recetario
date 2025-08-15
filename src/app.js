import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { securityMiddleware } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';
import api from './routes/index.js';
import { config } from './config/env.js';

const app = express();
app.set('trust proxy', 1);

// ===== CORS (antes de cualquier otro middleware) =====
const allowedOrigins = (config.corsOrigins || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // Permite requests sin Origin (curl/health checks)
    if (!origin) return cb(null, true);
    // Si no configuraste orígenes, permite (útil para primeras pruebas)
    if (allowedOrigins.length === 0) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true,          // deja true si envías Authorization/cookies
  optionsSuccessStatus: 204,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Responde preflight

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
