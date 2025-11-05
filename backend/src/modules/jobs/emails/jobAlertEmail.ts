/**
 * Job Alert Email Template
 *
 * This template is used to send job alert notifications to users
 * when new jobs matching their criteria are found.
 */

export interface JobAlertEmailData {
  user: {
    username: string;
    email: string;
  };
  alert: {
    id: string;
    name: string;
  };
  jobs: Array<{
    id: string;
    title: string;
    slug: string;
    company: {
      name: string;
      logoUrl?: string;
    };
    location: string;
    workLocation: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    publishedAt: Date;
  }>;
  unsubscribeUrl: string;
}

/**
 * Generate HTML email for job alerts
 */
export function generateJobAlertEmail(data: JobAlertEmailData): string {
  const { user, alert, jobs, unsubscribeUrl } = data;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const jobCount = jobs.length;

  const jobCards = jobs
    .map(
      (job) => `
    <tr>
      <td style="padding: 20px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${
              job.company.logoUrl
                ? `<td width="60" style="padding-right: 15px;">
                     <img src="${job.company.logoUrl}" alt="${job.company.name}" width="50" height="50" style="border-radius: 8px; display: block;">
                   </td>`
                : ''
            }
            <td>
              <h3 style="margin: 0 0 5px 0; font-size: 18px; color: #111827;">
                <a href="${baseUrl}/jobs/${job.slug}?alert=${alert.id}&job=${job.id}" style="color: #111827; text-decoration: none;">
                  ${job.title}
                </a>
              </h3>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${job.company.name} • ${job.location} • ${job.workLocation}
              </p>
              ${
                job.salaryMin && job.salaryMax
                  ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #059669; font-weight: 600;">
                       ${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency || '$'}${job.salaryMax.toLocaleString()}
                     </p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Matches - ${alert.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 20px; background-color: #2563eb; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🎯 ${jobCount} New Job${jobCount > 1 ? 's' : ''} Match Your Alert
              </h1>
              <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 14px;">
                ${alert.name}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 20px; background-color: #ffffff;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Hi ${user.username},
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151;">
                We found ${jobCount} new job${jobCount > 1 ? 's' : ''} that match your alert criteria. Check them out below:
              </p>
            </td>
          </tr>

          <!-- Job Cards -->
          ${jobCards}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
                Want to see more jobs?
                <a href="${baseUrl}/jobs?alert=${alert.id}" style="color: #2563eb; text-decoration: none; font-weight: 600;">Browse All Jobs</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                You're receiving this email because you created a job alert on Neurmatic.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from this alert</a> |
                <a href="${baseUrl}/settings/alerts" style="color: #9ca3af; text-decoration: underline;">Manage alerts</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate text version of job alert email
 */
export function generateJobAlertEmailText(data: JobAlertEmailData): string {
  const { user, alert, jobs, unsubscribeUrl } = data;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const jobCount = jobs.length;

  const jobList = jobs
    .map(
      (job, index) => `
${index + 1}. ${job.title}
   Company: ${job.company.name}
   Location: ${job.location} (${job.workLocation})
   ${job.salaryMin && job.salaryMax ? `Salary: ${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency || '$'}${job.salaryMax.toLocaleString()}` : ''}
   View: ${baseUrl}/jobs/${job.slug}?alert=${alert.id}&job=${job.id}
`
    )
    .join('\n');

  return `
Hi ${user.username},

We found ${jobCount} new job${jobCount > 1 ? 's' : ''} that match your alert: "${alert.name}"

${jobList}

Want to see more jobs? Browse all jobs: ${baseUrl}/jobs?alert=${alert.id}

---

You're receiving this email because you created a job alert on Neurmatic.

Unsubscribe from this alert: ${unsubscribeUrl}
Manage all alerts: ${baseUrl}/settings/alerts

© ${new Date().getFullYear()} Neurmatic. All rights reserved.
  `;
}

/**
 * Generate deadline reminder email for saved jobs
 */
export interface DeadlineReminderEmailData {
  user: {
    username: string;
    email: string;
  };
  jobs: Array<{
    id: string;
    title: string;
    slug: string;
    company: {
      name: string;
      logoUrl?: string;
    };
    expiresAt: Date;
    daysUntilExpiry: number;
  }>;
}

export function generateDeadlineReminderEmail(data: DeadlineReminderEmailData): string {
  const { user, jobs } = data;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const jobCards = jobs
    .map(
      (job) => `
    <tr>
      <td style="padding: 15px 20px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">
          <a href="${baseUrl}/jobs/${job.slug}" style="color: #111827; text-decoration: none;">
            ${job.title}
          </a>
        </h3>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          ${job.company.name}
        </p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #dc2626; font-weight: 600;">
          ⏰ Expires in ${job.daysUntilExpiry} day${job.daysUntilExpiry > 1 ? 's' : ''}
        </p>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Application Deadline Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 30px 20px; background-color: #dc2626; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⏰ Saved Jobs Expiring Soon
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px; background-color: #ffffff;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Hi ${user.username},
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151;">
                Don't miss out! Your saved jobs are expiring soon:
              </p>
            </td>
          </tr>

          ${jobCards}

          <tr>
            <td style="padding: 20px; background-color: #f9fafb; text-align: center;">
              <a href="${baseUrl}/jobs/saved" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View All Saved Jobs
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
