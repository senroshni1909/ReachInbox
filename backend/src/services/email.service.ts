import nodemailer from 'nodemailer';
import { getTransporter } from '../config/smtp.config.js';
import { SendEmailOptions, SendEmailResult } from '../types/index.js';

export async function sendEmail({ from, to, subject, body }: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter();

    // Check if the body contains HTML markup
    const isHtml = /<[a-z][\s\S]*>/i.test(body);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
    });

    const etherealUrl = nodemailer.getTestMessageUrl(info) || undefined;

    return {
      success: true,
      messageId: info.messageId,
      etherealUrl: etherealUrl ? String(etherealUrl) : undefined,
    };
  } catch (err: any) {
    console.error(`❌ [SMTP Error] Failed to send email to ${to}:`, err.message);
    return {
      success: false,
      messageId: '',
      error: err.message || 'Unknown SMTP transport error',
    };
  }
}
