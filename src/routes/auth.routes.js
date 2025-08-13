import { Router } from 'express';
import {
  validateLogin,
  validateRegister,
  register,
  login,
  me,
  verifyOtp,
  resendOtp
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

r.post('/register', validateRegister, register);
r.post('/login',    validateLogin,   login);
r.post('/verify-otp', verifyOtp);
r.post('/resend-otp', resendOtp);
r.get('/me', requireAuth, me);

export default r;
