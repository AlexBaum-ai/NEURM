import nodemailer from 'nodemailer';
import { unifiedConfig } from '@/config/unifiedConfig';
import logger from './logger';
import * as Sentry from '@sentry/node';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

/**
 * Send email using configured email service
 * Currently supports: Nodemailer (for SMTP/SendGrid/AWS SES)
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    // In development/test, log instead of sending
    if (unifiedConfig.server.nodeEnv === 'test' || !unifiedConfig.email.fromEmail) {
      logger.info('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        from: options.from || unifiedConfig.email.fromEmail,
      });
      return;
    }

    // Create transporter based on configuration
    let transporter;

    if (unifiedConfig.email.sendgridApiKey) {
      // SendGrid SMTP
      transporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: unifiedConfig.email.sendgridApiKey,
        },
      });
    } else if (unifiedConfig.email.awsSes.region) {
      // AWS SES
      transporter = nodemailer.createTransporter({
        host: `email-smtp.${unifiedConfig.email.awsSes.region}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: unifiedConfig.email.awsSes.accessKey,
          pass: unifiedConfig.email.awsSes.secretKey,
        },
      });
    } else {
      // Development fallback - Ethereal (fake SMTP)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Send email
    const info = await transporter.sendMail({
      from: options.from || unifiedConfig.email.fromEmail || '"Neurmatic" <noreply@neurmatic.com>',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    logger.info(`Email sent successfully: ${info.messageId}`, {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    // In development, log preview URL
    if (unifiedConfig.server.nodeEnv === 'development' && !unifiedConfig.email.sendgridApiKey) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Failed to send email:', error);
    Sentry.captureException(error, {
      tags: { utility: 'email' },
      extra: {
        to: options.to,
        subject: options.subject,
      },
    });
    throw error;
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Batch send emails with rate limiting
 * Useful for bulk operations like digests
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[],
  options?: {
    delayMs?: number; // Delay between emails
    maxConcurrent?: number; // Max concurrent sends
  }
): Promise<Array<{ success: boolean; email: string; error?: Error }>> {
  const delay = options?.delayMs || 100;
  const maxConcurrent = options?.maxConcurrent || 10;
  const results: Array<{ success: boolean; email: string; error?: Error }> = [];

  // Process in batches
  for (let i = 0; i < emails.length; i += maxConcurrent) {
    const batch = emails.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(async (emailOptions) => {
        try {
          await sendEmail(emailOptions);
          return {
            success: true,
            email: Array.isArray(emailOptions.to) ? emailOptions.to[0] : emailOptions.to,
          };
        } catch (error) {
          return {
            success: false,
            email: Array.isArray(emailOptions.to) ? emailOptions.to[0] : emailOptions.to,
            error: error as Error,
          };
        }
      })
    );

    results.push(...batchResults);

    // Delay between batches
    if (i + maxConcurrent < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delay * maxConcurrent));
    }
  }

  return results;
}
