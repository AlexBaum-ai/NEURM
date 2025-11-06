/**
 * Bull Board Configuration
 *
 * Dashboard for monitoring Bull queues
 */
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { analyticsQueue } from '@/jobs/queues/analyticsQueue';
import { articleSchedulerQueue } from '@/jobs/queues/articleSchedulerQueue';
import { emailQueue } from '@/jobs/queues/emailQueue';
import { notificationQueue } from '@/jobs/queues/notificationQueue';
import logger from '@/utils/logger';

// Create Express adapter for Bull Board
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board instance
export const bullBoard = createBullBoard({
  queues: [
    new BullMQAdapter(analyticsQueue),
    new BullMQAdapter(articleSchedulerQueue),
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Neurmatic Job Queues',
      boardLogo: {
        path: '/logo.png',
        width: '100px',
        height: 'auto',
      },
      miscLinks: [
        { text: 'Admin Dashboard', url: '/admin/dashboard' },
        { text: 'API Docs', url: '/api-docs' },
      ],
      favIcon: {
        default: '/favicon.ico',
        alternative: '/favicon-32x32.png',
      },
    },
  },
});

logger.info('Bull Board initialized at /admin/queues');

export default { serverAdapter, bullBoard };
