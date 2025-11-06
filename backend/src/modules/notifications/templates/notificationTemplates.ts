import { NotificationType } from '@prisma/client';
import { generateBaseEmailTemplate, EmailTemplateData } from './baseEmail.template';

/**
 * Notification email template generator
 * Creates appropriate email content based on notification type
 */

interface NotificationData {
  userName: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  dataJson?: any;
  unsubscribeUrl: string;
}

export const generateNotificationEmail = (data: NotificationData): string => {
  const { userName, type, title, message, actionUrl, dataJson, unsubscribeUrl } = data;

  // Customize action text based on notification type
  let actionText = 'View Details';

  switch (type) {
    case 'new_article_in_followed_category':
    case 'trending_article':
      actionText = 'Read Article';
      break;
    case 'topic_reply':
    case 'comment_reply':
      actionText = 'View Conversation';
      break;
    case 'mention':
      actionText = 'View Mention';
      break;
    case 'upvote':
    case 'downvote':
      actionText = 'View Post';
      break;
    case 'accepted_answer':
      actionText = 'View Answer';
      break;
    case 'new_job_match':
      actionText = 'View Job';
      break;
    case 'application_status_update':
      actionText = 'View Application';
      break;
    case 'profile_view':
      actionText = 'View Profile';
      break;
    case 'new_follower':
      actionText = 'View Profile';
      break;
    case 'badge_earned':
      actionText = 'View Badge';
      break;
    case 'reputation_milestone':
      actionText = 'View Reputation';
      break;
    case 'message':
      actionText = 'Read Message';
      break;
    case 'system_announcement':
    case 'account_update':
      actionText = 'View Announcement';
      break;
  }

  const emailData: EmailTemplateData = {
    userName,
    notificationTitle: title,
    notificationMessage: message,
    actionUrl,
    actionText: actionUrl ? actionText : undefined,
    unsubscribeUrl,
  };

  return generateBaseEmailTemplate(emailData);
};

/**
 * Generate digest email for multiple notifications
 */
export interface DigestNotification {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: Date;
}

export const generateDigestEmail = (
  userName: string,
  notifications: DigestNotification[],
  period: 'hourly' | 'daily' | 'weekly',
  unsubscribeUrl: string
): string => {
  const periodText = period === 'hourly' ? 'last hour' : period === 'daily' ? 'today' : 'this week';

  let notificationsHtml = '';

  for (const notification of notifications) {
    notificationsHtml += `
      <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${notification.title}</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280;">${notification.message}</p>
        ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">View →</a>` : ''}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Notifications Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #4f46e5;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 30px;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Neurmatic</div>
    </div>

    <div style="padding: 30px 0;">
      <p>Hi ${userName},</p>
      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Your Activity Digest</h1>
      <p style="color: #6b7280; margin-bottom: 24px;">Here's what happened ${periodText}:</p>

      ${notificationsHtml}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${unsubscribeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">View All Notifications</a>
      </div>
    </div>

    <div class="footer">
      <p>You're receiving this ${period} digest based on your preferences.</p>
      <p>
        <a href="${unsubscribeUrl}">Manage notification preferences</a> |
        <a href="mailto:support@neurmatic.com">Contact Support</a>
      </p>
      <p>&copy; ${new Date().getFullYear()} Neurmatic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
