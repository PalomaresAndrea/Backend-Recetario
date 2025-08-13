// src/config/env.js
import 'dotenv/config';

function toNumber(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),

  // 🔐 JWT
  jwtSecret: process.env.JWT_SECRET || 'devsecret',

  // 🗄️ DB
  mongoUri: process.env.MONGO_URI, // usar Atlas SRV o un mongodb:// local

  // ✉️ SMTP
  mail: {
    host: process.env.MAIL_HOST,
    port: toNumber(process.env.MAIL_PORT, 587),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER
  },

  buildSha: process.env.BUILD_SHA || 'local'
};
