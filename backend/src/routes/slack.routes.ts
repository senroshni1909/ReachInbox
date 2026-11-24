import { Router } from 'express';
import { SlackController } from '../controllers/slack.controller.js';

export const slackRoutes = Router();

slackRoutes.get('/status', SlackController.getSlackStatus);
slackRoutes.post('/configure', SlackController.configureSlack);
