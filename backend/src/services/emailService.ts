import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  // Use Ethereal test account for realistic previewable fake SMTP delivery
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  etherealUrl?: string;
  error?: string;
}

export async function sendEmail({ from, to, subject, body }: SendEmailParams): Promise<SendEmailResult> {
  try {
    const mailer = await getTransporter();

    const isHtml = /<[a-z][\s\S]*>/i.test(body);

    const info = await mailer.sendMail({
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
    return {
      success: false,
      messageId: '',
      error: err.message || 'Unknown SMTP transport error',
    };
  }
}
