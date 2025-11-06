import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import { prismaLoggingMiddleware } from '@/middleware/prisma-logging.middleware';

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Add logging middleware for slow query detection
prisma.$use(prismaLoggingMiddleware);

// Don't connect during module load - let Prisma handle it lazily
// This prevents blocking the application startup
// Connection will be established automatically on first query

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
});

export default prisma;
