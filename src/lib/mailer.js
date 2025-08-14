import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const DISABLED = String(process.env.MAIL_DISABLED || '').toLowerCase() === 'true';
let transporter = null;

export function getTransporter() {
  if (DISABLED) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   config.mail.host,
    port:   config.mail.port,
    secure: Number(config.mail.port) === 465,
    auth: { user: config.mail.user, pass: config.mail.pass },
  });
  return transporter;
}

export async function verifyTransport() {
  if (DISABLED) { console.warn('✉️ MAIL_DISABLED=true (modo dev).'); return; }
  try {
    await getTransporter().verify();
    console.log('✉️ SMTP listo: %s:%s como %s', config.mail.host, config.mail.port, config.mail.user);
  } catch (e) { console.error('❌ SMTP no disponible:', e?.message || e); }
}

export async function sendMail({ to, subject, html, text }) {
  if (DISABLED) { console.log('✉️ [FAKE SEND] ->', { to, subject }); return; }
  if (!config.mail.user) throw new Error('Mailer no configurado (MAIL_USER).');
  return getTransporter().sendMail({ from: config.mail.from, to, subject, html, text });
}
