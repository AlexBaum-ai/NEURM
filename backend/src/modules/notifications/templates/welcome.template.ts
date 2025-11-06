/**
 * Welcome Email Template
 *
 * Sent when a new user completes registration
 */

export interface WelcomeEmailData {
  username: string;
  email: string;
  verificationUrl?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { username, verificationUrl } = data;

  const subject = `Welcome to Neurmatic, ${username}! 🚀`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Neurmatic</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #5568d3;
    }
    .features {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature-item {
      margin: 12px 0;
      padding-left: 24px;
      position: relative;
    }
    .feature-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-radius: 0 0 10px 10px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Neurmatic!</h1>
    <p>The premier community for LLM enthusiasts and professionals</p>
  </div>

  <div class="content">
    <p>Hi ${username},</p>

    <p>Welcome to Neurmatic! We're thrilled to have you join our growing community of LLM developers, researchers, and enthusiasts.</p>

    ${verificationUrl ? `
    <p><strong>First things first - let's verify your email:</strong></p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Your Email</a>
    </div>
    ` : ''}

    <h3>🚀 Get Started</h3>

    <div class="features">
      <div class="feature-item">
        <strong>Explore the Forum:</strong> Ask questions, share knowledge, and learn from the community
      </div>
      <div class="feature-item">
        <strong>Browse LLM Models:</strong> Compare 47+ models with detailed specs and pricing
      </div>
      <div class="feature-item">
        <strong>Read Latest News:</strong> Stay updated with curated LLM content and tutorials
      </div>
      <div class="feature-item">
        <strong>Discover Use Cases:</strong> Learn from real-world LLM implementations
      </div>
      <div class="feature-item">
        <strong>Find Jobs:</strong> Connect with companies building the future of AI
      </div>
    </div>

    <h3>💡 Quick Tips</h3>
    <ul>
      <li><strong>Complete your profile:</strong> Add your skills and experience to get personalized recommendations</li>
      <li><strong>Follow topics:</strong> Get notified about discussions in areas you care about</li>
      <li><strong>Share your knowledge:</strong> The community thrives on shared experiences</li>
      <li><strong>Be respectful:</strong> We have zero tolerance for spam or harassment</li>
    </ul>

    <h3>🌟 Featured This Week</h3>
    <p>Check out our most popular content:</p>
    <ul>
      <li><a href="https://neurmatic.com/articles/getting-started-gpt-4">Getting Started with GPT-4: Complete Guide</a></li>
      <li><a href="https://neurmatic.com/articles/rag-systems-production-guide">Building Production-Ready RAG Systems</a></li>
      <li><a href="https://neurmatic.com/forum/prompt-engineering">Prompt Engineering Best Practices</a></li>
    </ul>

    <p>If you have any questions or need help getting started, just reply to this email. Our community team is here to help!</p>

    <p>Happy learning,<br>
    <strong>The Neurmatic Team</strong></p>
  </div>

  <div class="footer">
    <p>
      <a href="https://neurmatic.com">Visit Neurmatic</a> •
      <a href="https://neurmatic.com/forum">Forum</a> •
      <a href="https://neurmatic.com/models">LLM Models</a> •
      <a href="https://neurmatic.com/help">Help Center</a>
    </p>
    <p style="margin-top: 20px; color: #999; font-size: 12px;">
      You're receiving this email because you registered for Neurmatic.<br>
      <a href="{{unsubscribe_url}}">Unsubscribe</a> from welcome emails
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Neurmatic, ${username}!

We're thrilled to have you join our community of LLM enthusiasts and professionals.

${verificationUrl ? `First, verify your email: ${verificationUrl}\n` : ''}

🚀 GET STARTED

✓ Explore the Forum: Ask questions, share knowledge, learn from the community
✓ Browse LLM Models: Compare 47+ models with specs and pricing
✓ Read Latest News: Stay updated with curated LLM content
✓ Discover Use Cases: Learn from real-world implementations
✓ Find Jobs: Connect with companies building AI

💡 QUICK TIPS

- Complete your profile for personalized recommendations
- Follow topics to get notifications
- Share your knowledge with the community
- Be respectful - zero tolerance for spam

🌟 FEATURED THIS WEEK

- Getting Started with GPT-4: Complete Guide
- Building Production-Ready RAG Systems
- Prompt Engineering Best Practices

Questions? Just reply to this email!

Happy learning,
The Neurmatic Team

---
Visit Neurmatic: https://neurmatic.com
Unsubscribe: {{unsubscribe_url}}
  `;

  return { subject, html, text };
}

export default generateWelcomeEmail;
