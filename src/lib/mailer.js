// src/lib/mailer.js
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const DISABLED = String(process.env.MAIL_DISABLED || '').toLowerCase() === 'true';
let transporter = null;

export function getTransporter() {
  if (DISABLED) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   config.mail.host,
    port:   Number(config.mail.port),            // cast a número
    secure: Number(config.mail.port) === 465,    // true si 465
    auth: { user: config.mail.user, pass: config.mail.pass },
  });
  return transporter;
}

export async function verifyTransport() {
  if (DISABLED) { 
    console.warn('✉️ MAIL_DISABLED=true (modo dev).'); 
    return true;                                  // <-- truthy para tests
  }
  try {
    await getTransporter().verify();
    console.log('✉️ SMTP listo: %s:%s como %s', config.mail.host, config.mail.port, config.mail.user);
    return true;                                  // opcional, pero útil
  } catch (e) { 
    console.error('❌ SMTP no disponible:', e?.message || e); 
    throw e;
  }
}

export async function sendMail({ to, subject, html, text }) {
  if (DISABLED) { 
    console.log('✉️ [FAKE SEND] ->', { to, subject }); 
    return true;                                  // <-- truthy para tests
  }
  if (!config.mail.user) throw new Error('Mailer no configurado (MAIL_USER).');
  const from = config.mail.from || config.mail.user; // fallback seguro
  return getTransporter().sendMail({ from, to, subject, html, text });
}
