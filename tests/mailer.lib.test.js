// tests/mailer.lib.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('lib/mailer', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('MAIL_DISABLED=true: sendMail hace fake log y no falla', async () => {
    process.env.MAIL_DISABLED = 'true';
    const mailer = await import('../src/lib/mailer.js');
    await expect(mailer.sendMail({ to:'x@y.com', subject:'hi', html:'<b>x</b>' })).resolves.toBeTruthy();
  });

  it('mailer sin MAIL_USER lanza error', async () => {
    process.env.MAIL_DISABLED = 'false';
    process.env.MAIL_USER = '';
    const mailer = await import('../src/lib/mailer.js');
    await expect(mailer.sendMail({ to:'a@a.com', subject:'s' })).rejects.toBeInstanceOf(Error);
  });

  it('crea transporter con secure=true si puerto 465', async () => {
    process.env.MAIL_DISABLED = 'false';
    process.env.MAIL_USER = 'u';
    process.env.MAIL_PASS = 'p';
    process.env.MAIL_HOST = 'smtp.test';
    process.env.MAIL_PORT = '465';

    const created = [];
    vi.doMock('nodemailer', () => ({
      default: { createTransport: (opts) => (created.push(opts), { verify: () => Promise.resolve(), sendMail: () => Promise.resolve({}) }) }
    }));

    const mailer = await import('../src/lib/mailer.js');
    await mailer.verifyTransport();
    expect(created[0].secure).toBe(true);
  });
});
