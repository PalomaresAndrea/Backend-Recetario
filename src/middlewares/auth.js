// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/user.js';

export async function requireAuth(req, res, next) {
  // Soporta varios lugares comunes para el token
  const h = req.headers.authorization || '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : '';
  const token =
    bearer ||
    req.headers['x-auth-token'] ||
    req.query.token ||
    (req.cookies && req.cookies.token);

  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    const userId = payload.id || payload._id || payload.sub;
    let user = null;

    if (userId) {
      user = await User.findById(userId).select('-password');
    } else if (payload.email) {
      user = await User.findOne({ email: payload.email }).select('-password');
    }

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id), sub: String(user._id), email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}
