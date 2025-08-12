import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { config } from '../config/env.js';

const corsOpts = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman / curl
    const ok = config.corsOrigins.some(o => origin.startsWith(o));
    cb(ok ? null : new Error('CORS not allowed'), ok);
  },
  credentials: true
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false
});

export const securityMiddleware = [
  helmet({ crossOriginResourcePolicy: false }),
  corsOpts,
  hpp(),
  mongoSanitize(),
  xss(),
  limiter
];
