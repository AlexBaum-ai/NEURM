/**
 * Base email template
 * Provides consistent styling and structure for all notification emails
 */

export interface EmailTemplateData {
  userName: string;
  notificationTitle: string;
  notificationMessage: string;
  actionUrl?: string;
  actionText?: string;
  unsubscribeUrl: string;
}

export const generateBaseEmailTemplate = (data: EmailTemplateData): string => {
  const { userName, notificationTitle, notificationMessage, actionUrl, actionText, unsubscribeUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notificationTitle}</title>
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
    .content {
      padding: 30px 0;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background-color: #4338ca;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      font-size: 12px;
      color: #9ca3af;
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

    <div class="content">
      <p>Hi ${userName},</p>
      <h1>${notificationTitle}</h1>
      <p>${notificationMessage}</p>
      ${actionUrl && actionText ? `
      <a href="${actionUrl}" class="button">${actionText}</a>
      ` : ''}
    </div>

    <div class="footer">
      <p>You're receiving this email because you have notifications enabled.</p>
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
