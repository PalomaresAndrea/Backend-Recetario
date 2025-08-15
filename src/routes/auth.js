// src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { requireAuth, signToken } from '../middlewares/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * body: { email, password }
 * response: { token, user: { id, email, name } }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email = '', password = '' } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    // Trae el hash aunque en el schema esté select:false
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: String(user._id), email: user.email, name: user.name || '' }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * (Opcional) Registro rápido
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email = '', password = '', name = '' } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email, password: hash, name });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: String(user._id), email: user.email, name: user.name || '' }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me (protegido)
 */
router.get('/me', requireAuth, async (req, res) => {
  const u = req.user;
  res.json({ id: String(u._id), email: u.email, name: u.name || '' });
});

export default router;
