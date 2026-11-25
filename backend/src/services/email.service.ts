import nodemailer from 'nodemailer';
import { getTransporter } from '../config/smtp.config.js';
import { SendEmailOptions, SendEmailResult } from '../types/index.js';

export async function sendEmail({ from, to, subject, body, attachments }: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter();

    // Check if the body contains HTML markup
    const isHtml = /<[a-z][\s\S]*>/i.test(body);

    // Convert attachments to Nodemailer format
    const mailAttachments = attachments && attachments.length > 0
      ? attachments.map(att => {
          const rawBase64 = (att.content || att.dataUrl || '').replace(/^data:.*?;base64,/, '');
          return {
            filename: att.filename,
            content: Buffer.from(rawBase64, 'base64'),
            contentType: att.contentType || undefined,
          };
        })
      : undefined;

    if (mailAttachments && mailAttachments.length > 0) {
      console.log(`📎 [SMTP Attachments] Attaching ${mailAttachments.length} file(s): ${mailAttachments.map(a => `${a.filename} (${a.content.length} bytes)`).join(', ')}`);
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: isHtml ? undefined : body,
      html: isHtml ? body : undefined,
      attachments: mailAttachments,
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
