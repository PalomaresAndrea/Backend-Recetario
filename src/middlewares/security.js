// src/middlewares/security.js
import helmet from 'helmet';
import cors from 'cors';

// Lee y normaliza orígenes permitidos desde env (CORS_ORIGINS)
const raw = process.env.CORS_ORIGINS || '';
const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);

// Match flexible: exacto, comodín de subdominio (*.dominio.com) o regex /.../
function isOriginAllowed(origin) {
  if (!origin) return true;              // curl/Postman o same-origin
  if (allowed.length === 0) return true; // si no configuras, permite todo (dev)

  for (const pat of allowed) {
    if (pat === '*') return true;
    if (pat.startsWith('/') && pat.endsWith('/')) {
      try { if (new RegExp(pat.slice(1, -1)).test(origin)) return true; } catch {}
      continue;
    }
    if (pat.startsWith('*.')) {
      try {
        const host = new URL(origin).hostname;
        const base = pat.slice(2);
        if (host === base || host.endsWith(`.${base}`)) return true;
      } catch {}
    }
    if (origin === pat) return true;
  }
  return false;
}

export const securityMiddleware = [
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),

  // **ÚNICO CORS de la app**
  cors({
    origin: (origin, cb) => {
      const ok = isOriginAllowed(origin);
      if (!ok) return cb(new Error('Not allowed by CORS'), false);
      cb(null, true);
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  }),
];
