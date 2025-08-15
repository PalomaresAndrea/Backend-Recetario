// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/user.js';

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const userId = payload.id || payload.sub || payload._id;
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const user = await User.findById(userId).select('-password');
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
