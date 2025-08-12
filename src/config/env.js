import 'dotenv/config';

const required = (key, fallback = undefined) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${key}`);
  return v;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required('JWT_SECRET', 'dev-secret'),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/recetario'),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  appInsights: process.env.APPINSIGHTS_CONNECTION_STRING ?? '',
  buildSha: process.env.BUILD_SHA ?? '',
};
