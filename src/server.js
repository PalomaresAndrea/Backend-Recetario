// src/server.js
import express from 'express';
import { corsMiddleware, helmetMiddleware } from './middlewares/security.js';

const app = express();

app.use(corsMiddleware);
app.options('*', corsMiddleware); // <-- preflight global

app.use(express.json());
app.use(helmetMiddleware);

import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () =>
  console.log(`🚀 API escuchando en http://0.0.0.0:${port}`)
);
// al final de server.js, después de montar rutas
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
