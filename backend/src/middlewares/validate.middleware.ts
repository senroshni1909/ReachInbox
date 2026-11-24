import { Request, Response, NextFunction } from 'express';
import { ScheduleRequestBody } from '../types/index.js';

export function validateScheduleRequest(req: Request, res: Response, next: NextFunction): void {
  const { sender, recipients, subject, body, delayBetweenEmails, hourlyLimit } = req.body as Partial<ScheduleRequestBody>;

  if (!sender || typeof sender !== 'string' || !sender.includes('@')) {
    res.status(400).json({
      error: 'Invalid sender email. Please specify a valid sender address.',
    });
    return;
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({
      error: 'Recipients list is required and must contain at least one valid email address.',
    });
    return;
  }

  // Filter valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validRecipients = recipients.filter(r => typeof r === 'string' && emailRegex.test(r.trim()));

  if (validRecipients.length === 0) {
    res.status(400).json({
      error: 'None of the provided recipient emails are valid format.',
    });
    return;
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    res.status(400).json({
      error: 'Email subject line is required.',
    });
    return;
  }

  if (delayBetweenEmails !== undefined && (isNaN(Number(delayBetweenEmails)) || Number(delayBetweenEmails) < 0)) {
    res.status(400).json({
      error: 'Delay between emails must be a non-negative number of seconds.',
    });
    return;
  }

  if (hourlyLimit !== undefined && (isNaN(Number(hourlyLimit)) || Number(hourlyLimit) < 1)) {
    res.status(400).json({
      error: 'Hourly limit must be a positive integer greater than zero.',
    });
    return;
  }

  // Sanitize valid recipients back into request body
  req.body.recipients = validRecipients.map(r => r.trim());
  next();
}
