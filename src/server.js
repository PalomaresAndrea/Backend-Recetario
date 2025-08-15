// src/server.js
import express from 'express';
import { corsMiddleware, helmetMiddleware } from './middlewares/security.js';

const app = express();

// CORS primero
app.use(corsMiddleware);
app.options('*', corsMiddleware); // maneja preflight global

app.use(express.json());
app.use(helmetMiddleware);

// Rutas
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health / Ready (opcional)
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.get('/ready', (_req, res) => {
  const ready = globalThis.mongoReady === true; // o tu bandera real
  return ready ? res.status(200).json({ ready: true }) : res.status(503).json({ ready: false });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API escuchando en http://0.0.0.0:${port}`);
});
