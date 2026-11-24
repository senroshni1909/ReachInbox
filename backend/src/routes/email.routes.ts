import { Router } from 'express';
import { EmailController } from '../controllers/email.controller.js';
import { validateScheduleRequest } from '../middlewares/validate.middleware.js';

export const emailRoutes = Router();

emailRoutes.get('/scheduled', EmailController.getScheduledEmails);
emailRoutes.get('/sent', EmailController.getSentEmails);
emailRoutes.post('/schedule', validateScheduleRequest, EmailController.scheduleEmails);
emailRoutes.delete('/scheduled/:id', EmailController.cancelScheduledEmail);
