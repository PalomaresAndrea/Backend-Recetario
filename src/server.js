// src/server.js
import express from 'express';
import { corsMiddleware, helmetMiddleware } from './middlewares/security.js';
import { connectDB, dbState } from './config/db.js';
import { config } from './config/env.js';

const app = express();

// CORS + preflight
app.use(corsMiddleware);
app.options('*', corsMiddleware);

// Body parser + seguridad
app.use(express.json());
app.use(helmetMiddleware);

// Health endpoints siempre disponibles
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/ready', (_req, res) => {
  if (dbState.connected) return res.json({ ready: true });
  return res.status(503).json({ ready: false, error: dbState.lastError?.message || 'DB not connected' });
});

// 🔒 Middleware para garantizar DB lista en todas las rutas /api/*
function requireDB(req, res, next) {
  if (!dbState.connected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}
app.use('/api', requireDB);

// Rutas
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Manejo de errores global (siempre al final)
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', {
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
    stack: err?.stack,
  });
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// 🚀 Arranque: conecta a Mongo ANTES de escuchar
const port = config.port || 3000;
await connectDB({ retries: 5, intervalMs: 3000 });   // ← IMPORTANTE

app.listen(port, '0.0.0.0', () =>
  console.log(`🚀 API escuchando en http://0.0.0.0:${port}`)
);
