import { Request, Response } from 'express';
import { scheduleEmailBatch, cancelJob } from '../services/queue.service.js';
import { StoreService, formatJobToDto } from '../services/store.service.js';
import { FormattedEmailJob } from '../types/index.js';

export class EmailController {
  /**
   * POST /api/emails/schedule
   */
  static async scheduleEmails(req: Request, res: Response): Promise<void> {
    try {
      const { sender, recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit, userId } = req.body;

      const jobs = await scheduleEmailBatch({
        sender,
        recipients,
        subject,
        body,
        startTime,
        delayBetweenEmails,
        hourlyLimit,
        userId,
      });

      res.status(201).json({
        success: true,
        scheduledCount: jobs.length,
        jobs: jobs.map(j => formatJobToDto(j)),
      });
    } catch (err: any) {
      console.error('Error in scheduleEmails:', err);
      res.status(500).json({ error: err.message || 'Failed to schedule emails' });
    }
  }

  /**
   * GET /api/emails/scheduled
   */
  static async getScheduledEmails(req: Request, res: Response): Promise<void> {
    try {
      const { q, sender, status } = req.query;

      const result = await StoreService.getScheduled({
        q: q ? String(q) : undefined,
        sender: sender ? String(sender) : undefined,
        status: status ? String(status) : undefined,
      });

      const mapped: FormattedEmailJob[] = result.emails.map(e => formatJobToDto(e));
      res.json({ emails: mapped, total: result.total });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch scheduled emails' });
    }
  }

  /**
   * GET /api/emails/sent
   */
  static async getSentEmails(req: Request, res: Response): Promise<void> {
    try {
      const { q, sender, status } = req.query;

      const result = await StoreService.getSent({
        q: q ? String(q) : undefined,
        sender: sender ? String(sender) : undefined,
        status: status ? String(status) : undefined,
      });

      const mapped: FormattedEmailJob[] = result.emails.map(e => formatJobToDto(e));
      res.json({ emails: mapped, total: result.total });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch sent emails' });
    }
  }

  /**
   * GET /api/emails/:id
   */
  static async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const job = await StoreService.getJobById(id);
      if (!job) {
        res.status(404).json({ error: 'Email not found in database.' });
        return;
      }
      res.json({ email: formatJobToDto(job) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch email by ID' });
    }
  }

  /**
   * DELETE /api/emails/scheduled/:id
   */
  static async cancelScheduledEmail(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const targetId = Array.isArray(id) ? id[0] : id;
      await cancelJob(targetId);
      res.json({ success: true, message: 'Job cancelled successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to cancel job' });
    }
  }
}
