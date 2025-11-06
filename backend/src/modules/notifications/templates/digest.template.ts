/**
 * Daily/Weekly Digest Email Template
 *
 * Sent to users with digest preferences enabled
 */

export interface DigestEmailData {
  username: string;
  period: 'daily' | 'weekly';
  trendingArticles: Array<{
    title: string;
    url: string;
    views: number;
  }>;
  popularTopics: Array<{
    title: string;
    url: string;
    replies: number;
  }>;
  newJobs: Array<{
    title: string;
    company: string;
    url: string;
  }>;
  unreadNotifications: number;
}

export function generateDigestEmail(data: DigestEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { username, period, trendingArticles, popularTopics, newJobs, unreadNotifications } = data;

  const periodLabel = period === 'daily' ? 'Today' : 'This Week';
  const subject = `Your ${period} Neurmatic digest - ${periodLabel}'s highlights`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${periodLabel}'s Neurmatic Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #667eea;
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 8px;
    }
    .item {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 12px;
      border-left: 3px solid #667eea;
    }
    .item h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .item h3 a {
      color: #333;
      text-decoration: none;
    }
    .item h3 a:hover {
      color: #667eea;
    }
    .item-meta {
      color: #666;
      font-size: 14px;
    }
    .stat {
      display: inline-block;
      margin-right: 15px;
      color: #667eea;
      font-weight: 600;
    }
    .cta {
      text-align: center;
      padding: 30px 20px;
      background: #f8f9fa;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 5px;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 13px;
      background: #f8f9fa;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 ${periodLabel}'s Neurmatic Digest</h1>
      <p>Your personalized LLM community highlights</p>
    </div>

    <div class="content">
      <p>Hi ${username},</p>
      <p>Here's what you missed in the Neurmatic community ${period === 'daily' ? 'today' : 'this week'}:</p>

      ${unreadNotifications > 0 ? `
      <div style="background: #fff3cd; border-left: 3px solid #ffc107; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <strong>📢 You have ${unreadNotifications} unread notification${unreadNotifications > 1 ? 's' : ''}</strong><br>
        <a href="https://neurmatic.com/notifications" style="color: #856404;">View all notifications →</a>
      </div>
      ` : ''}

      ${trendingArticles.length > 0 ? `
      <div class="section">
        <h2>🔥 Trending Articles</h2>
        ${trendingArticles.map(article => `
          <div class="item">
            <h3><a href="${article.url}">${article.title}</a></h3>
            <div class="item-meta">
              <span class="stat">${article.views.toLocaleString()} views</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${popularTopics.length > 0 ? `
      <div class="section">
        <h2>💬 Popular Discussions</h2>
        ${popularTopics.map(topic => `
          <div class="item">
            <h3><a href="${topic.url}">${topic.title}</a></h3>
            <div class="item-meta">
              <span class="stat">${topic.replies} replies</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${newJobs.length > 0 ? `
      <div class="section">
        <h2>💼 New Job Opportunities</h2>
        ${newJobs.map(job => `
          <div class="item">
            <h3><a href="${job.url}">${job.title}</a></h3>
            <div class="item-meta">
              <span>${job.company}</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <div class="cta">
      <p style="margin-bottom: 20px;"><strong>Want to join the conversation?</strong></p>
      <a href="https://neurmatic.com/forum" class="button">Visit Forum</a>
      <a href="https://neurmatic.com/articles" class="button">Read Articles</a>
    </div>

    <div class="footer">
      <p>
        <a href="https://neurmatic.com/settings/notifications">Manage Digest Preferences</a> •
        <a href="https://neurmatic.com">Visit Neurmatic</a>
      </p>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        You're receiving this ${period} digest from Neurmatic.<br>
        <a href="{{unsubscribe_url}}">Unsubscribe</a> from digest emails
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${periodLabel}'S NEURMATIC DIGEST
Your personalized LLM community highlights

Hi ${username},

Here's what you missed ${period === 'daily' ? 'today' : 'this week'}:

${unreadNotifications > 0 ? `📢 You have ${unreadNotifications} unread notifications\nView: https://neurmatic.com/notifications\n\n` : ''}

${trendingArticles.length > 0 ? `
🔥 TRENDING ARTICLES
${trendingArticles.map(article => `- ${article.title} (${article.views.toLocaleString()} views)\n  ${article.url}`).join('\n\n')}
` : ''}

${popularTopics.length > 0 ? `
💬 POPULAR DISCUSSIONS
${popularTopics.map(topic => `- ${topic.title} (${topic.replies} replies)\n  ${topic.url}`).join('\n\n')}
` : ''}

${newJobs.length > 0 ? `
💼 NEW JOB OPPORTUNITIES
${newJobs.map(job => `- ${job.title} at ${job.company}\n  ${job.url}`).join('\n\n')}
` : ''}

Visit Neurmatic: https://neurmatic.com
Manage preferences: https://neurmatic.com/settings/notifications
Unsubscribe: {{unsubscribe_url}}
  `;

  return { subject, html, text };
}

export default generateDigestEmail;
