// src/middlewares/security.js
import cors from 'cors';
import helmet from 'helmet';

const allowAll = (process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true';

const raw = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// además acepta dominio *.azurewebsites.net del FE
const extraAzure = [
  'https://recetario-frontend.azurewebsites.net',
  'http://localhost:5173',
];

const whitelist = Array.from(new Set([...raw, ...extraAzure]));

// Opción 1 (diagnóstico): reflejar cualquier Origin válido
const corsOptions = allowAll
  ? {
      origin: true,               // refleja el Origin entrante
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization'],
      optionsSuccessStatus: 204,
    }
  // Opción 2: whitelist estricta
  : {
      origin(origin, cb) {
        if (!origin) return cb(null, true); // curl/health/monitores
        if (whitelist.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization'],
      optionsSuccessStatus: 204,
    };

export const corsMiddleware = cors(corsOptions);
export const helmetMiddleware = helmet();
