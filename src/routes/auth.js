// src/routes/auth.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import User from '../models/User.js';

const router = Router();

/**
 * POST /api/auth/login
 * body: { email, password }
 * Responde: { token, user: { id, email, name } }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email = '', password = '' } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    // Trae el hash aunque password sea select:false en el schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, String(user.password));
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ sub: String(user._id), email: user.email }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: String(user._id), email: user.email, name: user.name || '' }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
