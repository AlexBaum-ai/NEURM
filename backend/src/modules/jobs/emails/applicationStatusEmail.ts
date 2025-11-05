import { ApplicationStatus } from '@prisma/client';

/**
 * Email templates for application status updates
 */

interface ApplicationStatusEmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  applicationUrl: string;
  companyLogoUrl?: string;
  nextSteps?: string;
}

/**
 * Get email subject based on status
 */
export function getStatusEmailSubject(
  status: ApplicationStatus,
  jobTitle: string
): string {
  const subjects: Record<ApplicationStatus, string> = {
    submitted: `Application Received - ${jobTitle}`,
    viewed: `Your Application is Being Reviewed - ${jobTitle}`,
    screening: `Your Application is Under Review - ${jobTitle}`,
    interview: `Interview Invitation - ${jobTitle}`,
    offer: `Job Offer - ${jobTitle}`,
    rejected: `Application Update - ${jobTitle}`,
    withdrawn: `Application Withdrawn - ${jobTitle}`,
  };

  return subjects[status];
}

/**
 * Get email template for status update
 */
export function getStatusEmailTemplate(
  data: ApplicationStatusEmailData
): string {
  const {
    candidateName,
    jobTitle,
    companyName,
    status,
    applicationUrl,
    companyLogoUrl,
    nextSteps,
  } = data;

  // Common header
  const header = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getStatusEmailSubject(status, jobTitle)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #4F46E5;
        }
        .logo {
          max-width: 120px;
          height: auto;
        }
        .content {
          padding: 30px 0;
        }
        h1 {
          color: #1F2937;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          margin: 20px 0;
        }
        .status-viewed { background-color: #DBEAFE; color: #1E40AF; }
        .status-screening { background-color: #FEF3C7; color: #92400E; }
        .status-interview { background-color: #D1FAE5; color: #065F46; }
        .status-offer { background-color: #D1FAE5; color: #065F46; }
        .status-rejected { background-color: #FEE2E2; color: #991B1B; }
        .job-details {
          background-color: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .job-title {
          font-size: 18px;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 8px;
        }
        .company-name {
          color: #6B7280;
          font-size: 14px;
        }
        .next-steps {
          background-color: #EFF6FF;
          border-left: 4px solid #3B82F6;
          padding: 16px;
          margin: 20px 0;
        }
        .next-steps h3 {
          margin-top: 0;
          color: #1E40AF;
        }
        .cta-button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .cta-button:hover {
          background-color: #4338CA;
        }
        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" class="logo">` : `<h2>${companyName}</h2>`}
        </div>
        <div class="content">
  `;

  // Common footer
  const footer = `
        </div>
        <div class="footer">
          <p>This is an automated email from Neurmatic Job Platform.</p>
          <p>© ${new Date().getFullYear()} Neurmatic. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Status-specific content
  let content = '';

  switch (status) {
    case 'submitted':
      content = `
        <h1>Application Received</h1>
        <p>Hi ${candidateName},</p>
        <p>Thank you for applying! We've successfully received your application for the following position:</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        <p>We're reviewing all applications and will get back to you soon.</p>
        <a href="${applicationUrl}" class="cta-button">View Application Status</a>
      `;
      break;

    case 'viewed':
      content = `
        <h1>Application Being Reviewed</h1>
        <span class="status-badge status-viewed">Under Review</span>
        <p>Hi ${candidateName},</p>
        <p>Great news! Your application for <strong>${jobTitle}</strong> at ${companyName} has been viewed by our hiring team.</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        <p>We're carefully reviewing your qualifications and will be in touch if there's a match.</p>
        <a href="${applicationUrl}" class="cta-button">View Application Status</a>
      `;
      break;

    case 'screening':
      content = `
        <h1>Application Under Screening</h1>
        <span class="status-badge status-screening">Screening in Progress</span>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${jobTitle}</strong> at ${companyName} is currently under detailed screening.</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        ${nextSteps ? `
        <div class="next-steps">
          <h3>What's Next?</h3>
          <p>${nextSteps}</p>
        </div>
        ` : ''}
        <p>We'll notify you as soon as there's an update on your application.</p>
        <a href="${applicationUrl}" class="cta-button">View Application Status</a>
      `;
      break;

    case 'interview':
      content = `
        <h1>🎉 Interview Invitation</h1>
        <span class="status-badge status-interview">Interview Stage</span>
        <p>Hi ${candidateName},</p>
        <p>Congratulations! We're impressed with your application and would like to invite you for an interview for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        ${nextSteps ? `
        <div class="next-steps">
          <h3>Interview Details</h3>
          <p>${nextSteps}</p>
        </div>
        ` : `
        <div class="next-steps">
          <h3>Next Steps</h3>
          <p>Please check your application dashboard for interview scheduling details. We'll be in touch shortly to coordinate a time that works for you.</p>
        </div>
        `}
        <a href="${applicationUrl}" class="cta-button">View Interview Details</a>
      `;
      break;

    case 'offer':
      content = `
        <h1>🎊 Job Offer</h1>
        <span class="status-badge status-offer">Offer Extended</span>
        <p>Hi ${candidateName},</p>
        <p>We're thrilled to extend an offer for the <strong>${jobTitle}</strong> position at ${companyName}!</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        <div class="next-steps">
          <h3>Next Steps</h3>
          <p>${nextSteps || 'Please review the offer details in your application dashboard. We look forward to having you on our team!'}</p>
        </div>
        <a href="${applicationUrl}" class="cta-button">View Offer Details</a>
      `;
      break;

    case 'rejected':
      content = `
        <h1>Application Update</h1>
        <p>Hi ${candidateName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at ${companyName}.</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        <p>After careful consideration, we've decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
        <p>We appreciate the time you invested in the application process and encourage you to apply for future openings that match your skills and experience.</p>
        <p>We wish you the best in your job search!</p>
        <a href="${applicationUrl}" class="cta-button">View Other Opportunities</a>
      `;
      break;

    case 'withdrawn':
      content = `
        <h1>Application Withdrawn</h1>
        <p>Hi ${candidateName},</p>
        <p>This is to confirm that you have withdrawn your application for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
        <div class="job-details">
          <div class="job-title">${jobTitle}</div>
          <div class="company-name">${companyName}</div>
        </div>
        <p>We understand that circumstances change, and we appreciate you letting us know.</p>
        <p>We hope to see you apply for future opportunities at ${companyName}!</p>
        <a href="https://neurmatic.com/jobs" class="cta-button">Browse Other Jobs</a>
      `;
      break;

    default:
      content = `
        <h1>Application Status Update</h1>
        <p>Hi ${candidateName},</p>
        <p>Your application for <strong>${jobTitle}</strong> at ${companyName} has been updated.</p>
        <a href="${applicationUrl}" class="cta-button">View Application Status</a>
      `;
  }

  return header + content + footer;
}

/**
 * Get plain text version of the email
 */
export function getStatusEmailPlainText(
  data: ApplicationStatusEmailData
): string {
  const { candidateName, jobTitle, companyName, status, applicationUrl } = data;

  const messages: Record<ApplicationStatus, string> = {
    submitted: `
Hi ${candidateName},

Thank you for applying! We've successfully received your application for ${jobTitle} at ${companyName}.

We're reviewing all applications and will get back to you soon.

View your application: ${applicationUrl}

Best regards,
${companyName}
    `,
    viewed: `
Hi ${candidateName},

Great news! Your application for ${jobTitle} at ${companyName} has been viewed by our hiring team.

We're carefully reviewing your qualifications and will be in touch if there's a match.

View your application: ${applicationUrl}

Best regards,
${companyName}
    `,
    screening: `
Hi ${candidateName},

Your application for ${jobTitle} at ${companyName} is currently under detailed screening.

We'll notify you as soon as there's an update on your application.

View your application: ${applicationUrl}

Best regards,
${companyName}
    `,
    interview: `
Hi ${candidateName},

Congratulations! We're impressed with your application and would like to invite you for an interview for the ${jobTitle} position at ${companyName}.

Please check your application dashboard for interview scheduling details.

View interview details: ${applicationUrl}

Best regards,
${companyName}
    `,
    offer: `
Hi ${candidateName},

We're thrilled to extend an offer for the ${jobTitle} position at ${companyName}!

Please review the offer details in your application dashboard.

View offer details: ${applicationUrl}

Best regards,
${companyName}
    `,
    rejected: `
Hi ${candidateName},

Thank you for your interest in the ${jobTitle} position at ${companyName}.

After careful consideration, we've decided to move forward with other candidates whose qualifications more closely match our current needs.

We appreciate the time you invested in the application process and encourage you to apply for future openings.

Best regards,
${companyName}
    `,
    withdrawn: `
Hi ${candidateName},

This is to confirm that you have withdrawn your application for the ${jobTitle} position at ${companyName}.

We hope to see you apply for future opportunities!

Best regards,
${companyName}
    `,
  };

  return messages[status];
}
