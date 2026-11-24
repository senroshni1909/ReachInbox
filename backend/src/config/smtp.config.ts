import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV } from './env.config.js';

let transporterInstance: Transporter | null = null;

export function getTransporter(): Transporter {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE, // false for port 587 (uses STARTTLS)
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents local self-signed cert blocks
      },
    });
  }
  return transporterInstance;
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`✅ [SMTP] Successfully connected to Ethereal SMTP at ${ENV.SMTP_HOST}:${ENV.SMTP_PORT} as ${ENV.SMTP_USER}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ [SMTP] Verification warning: ${error.message}. Emails will still be attempted.`);
    return false;
  }
}
