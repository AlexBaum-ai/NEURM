import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env from '@/config/env';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Enhanced format with more context
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const argsStr = Object.keys(args).length ? JSON.stringify(args, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${argsStr}`;
  })
);

const transports: winston.transport[] = [];

// Console transport
if (env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format,
    })
  );
}

// File transports with rotation
if (env.NODE_ENV === 'production') {
  // Error logs with rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format,
      maxSize: '20m',
      maxFiles: '30d', // Keep for 30 days
      zippedArchive: true,
    })
  );

  // Combined logs with rotation
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format,
      maxSize: '20m',
      maxFiles: '14d', // Keep for 14 days
      zippedArchive: true,
    })
  );

  // Performance logs (info level only)
  transports.push(
    new DailyRotateFile({
      filename: 'logs/performance-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format,
      maxSize: '20m',
      maxFiles: '7d', // Keep for 7 days
      zippedArchive: true,
    })
  );
} else {
  // Development file logs (no rotation)
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log with request context
 */
export function logWithContext(
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context?: Record<string, any>
) {
  logger.log(level, message, context);
}

/**
 * Log performance metric
 */
export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    metric: 'performance',
  });
}

/**
 * Log security event
 */
export function logSecurity(event: string, userId?: number, metadata?: Record<string, any>) {
  logger.warn(`Security: ${event}`, {
    event,
    userId,
    ...metadata,
    type: 'security',
  });
}

/**
 * Log audit trail
 */
export function logAudit(action: string, userId: number, resource: string, metadata?: Record<string, any>) {
  logger.info(`Audit: ${action}`, {
    action,
    userId,
    resource,
    ...metadata,
    type: 'audit',
  });
}

export default logger;
