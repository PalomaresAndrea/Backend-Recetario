import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.js';
import { signToken } from '../middlewares/auth.js';
import { sendMail } from '../lib/mailer.js';

const OTP_TTL_MIN = 10;        // expira en 10 min
const RESEND_COOLDOWN_SEC = 60; // 60s entre reenvíos
const MAX_ATTEMPTS = 5;

export const validateRegister = [
  body('name').isLength({ min: 2 }).withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 caracteres'),
];

export const validateLogin = [
  body('email').isEmail(),
  body('password').notEmpty()
];

function generateOtp() {
  // 6 dígitos, sin ceros a la izquierda “perdidos”
  const code = ('' + (crypto.randomInt(0, 1000000))).padStart(6, '0');
  return code;
}

async function setOtpForUser(user) {
  const code = generateOtp();
  const salt = await bcrypt.genSalt(10);
  user.otpCodeHash = await bcrypt.hash(code, salt);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  // ✉️ Enviar correo (HTML simple)
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial">
      <h2>Tu código de verificación</h2>
      <p>Usa este código para verificar tu correo:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p>Expira en ${OTP_TTL_MIN} minutos.</p>
      <hr/>
      <p>Si no solicitaste este registro, ignora este mensaje.</p>
    </div>
  `;
  await sendMail({
    to: user.email,
    subject: 'Tu código OTP - Recetario K-pop',
    html,
    text: `Tu código es: ${code} (expira en ${OTP_TTL_MIN} minutos)`,
  });
}

export async function register(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists && exists.emailVerified) {
    return res.status(400).json({ error: 'Email ya registrado' });
  }

  let user = exists;
  if (!user) {
    user = await User.create({ name, email, password, emailVerified: false });
  } else {
    // si existía no verificado, actualiza pass y nombre
    user.name = name;
    user.password = password;
    await user.save();
  }

  await setOtpForUser(user);
  return res.status(201).json({ message: 'Registro recibido. Revisa tu correo para el OTP.' });
}

export async function resendOtp(req, res) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const user = await User.findOne({ email }).select('+otpLastSentAt');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.emailVerified) return res.status(400).json({ error: 'Email ya verificado' });

  const now = Date.now();
  const last = user.otpLastSentAt?.getTime?.() || 0;
  if (now - last < RESEND_COOLDOWN_SEC * 1000) {
    const rest = Math.ceil((RESEND_COOLDOWN_SEC * 1000 - (now - last)) / 1000);
    return res.status(429).json({ error: `Espera ${rest}s para reenviar` });
  }

  await setOtpForUser(user);
  return res.json({ message: 'OTP reenviado. Revisa tu correo.' });
}

export async function verifyOtp(req, res) {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: 'Email y código son requeridos' });

  const user = await User.findOne({ email }).select('+otpCodeHash +otpExpiresAt +otpAttempts');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.emailVerified) return res.status(400).json({ error: 'Email ya verificado' });

  if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: 'OTP expirado. Solicita reenviar.' });
  }

  if (user.otpAttempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Demasiados intentos. Reenvía el OTP.' });
  }

  const ok = await bcrypt.compare(code, user.otpCodeHash || '');
  user.otpAttempts += 1;

  if (!ok) {
    await user.save();
    return res.status(400).json({ error: 'Código incorrecto' });
  }

  user.emailVerified = true;
  user.otpCodeHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();

  const token = signToken(user);
  return res.json({ message: 'Correo verificado ✅', token, user: user.toJSON() });
}

export async function login(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  if (!user.emailVerified) {
    return res.status(403).json({ error: 'Debes verificar tu correo con el OTP.' });
  }
  const token = signToken(user);
  return res.json({ user: { ...user.toJSON(), password: undefined }, token });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
