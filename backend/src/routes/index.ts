import { Router } from 'express';
import { emailRoutes } from './email.routes.js';
import { queueRoutes } from './queue.routes.js';
import { slackRoutes } from './slack.routes.js';

export const apiRouter = Router();

apiRouter.use('/emails', emailRoutes);
apiRouter.use('/queue', queueRoutes);
apiRouter.use('/slack', slackRoutes);
