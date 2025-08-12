import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/user.js';

export function signToken(user) {
  return jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '7d' });
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
