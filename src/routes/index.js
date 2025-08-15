import { Router } from 'express';

// ⚠️ Usa alias para no chocar con "auth" de middlewares
import authRoutes from './auth.js';
// Si tienes más routers, impórtalos con nombres únicos:
import recipesRoutes from './recipes.js';

const api = Router();

// Monta rutas
api.use('/auth', authRoutes);
api.use('/recipes', recipesRoutes);

export default api;
