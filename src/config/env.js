// src/config/env.js
import 'dotenv/config';

function toNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export const config = {
  env: process.env.NODE_ENV || 'production',

  // Prioriza PORT (App Service), luego WEBSITES_PORT; default 8080 (no uses 80).
  port: Number(process.env.PORT || process.env.WEBSITES_PORT || 8080),

  corsOrigins: process.env.CORS_ORIGINS || '',

  // 🔐 JWT
  jwtSecret: process.env.JWT_SECRET || 'devsecret',

  // 🗄️ DB
  mongoUri: (process.env.MONGO_URI || '').trim(),

  // ✉️ SMTP (opcional)
  mail: {
    host: process.env.MAIL_HOST,
    port: toNumber(process.env.MAIL_PORT, 587),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER
  },

  buildSha: process.env.BUILD_SHA || 'local'
};
