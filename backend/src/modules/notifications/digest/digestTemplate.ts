import mjml2html from 'mjml';
import { unifiedConfig } from '@/config/unifiedConfig';

/**
 * Email Digest Templates
 * Responsive email templates built with MJML
 */

export interface DigestContent {
  topStories?: Array<{
    id: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    url: string;
    imageUrl?: string;
    category: string;
  }>;
  trendingDiscussions?: Array<{
    id: string;
    title: string;
    author: string;
    replyCount: number;
    viewCount: number;
    lastActivityAt: string;
    url: string;
    category: string;
  }>;
  jobMatches?: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    matchScore: number;
    url: string;
    salary?: string;
    type: string;
  }>;
  activitySummary?: {
    newFollowers: number;
    topicReplies: number;
    upvotes: number;
    badgesEarned: number;
  };
}

export interface DigestData {
  user: {
    firstName: string;
    email: string;
  };
  type: 'daily' | 'weekly';
  content: DigestContent;
  unsubscribeToken: string;
  trackingToken: string;
  date: string;
}

/**
 * Generate daily digest email HTML
 */
export function generateDailyDigest(data: DigestData): string {
  const { user, content, unsubscribeToken, trackingToken, date } = data;
  const frontendUrl = unifiedConfig.server.frontendUrl;

  const mjml = `
<mjml>
  <mj-head>
    <mj-title>Your Daily Neurmatic Digest</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
      <mj-text font-size="14px" line-height="1.6" color="#374151" />
      <mj-section padding="20px" />
    </mj-attributes>
    <mj-style inline="inline">
      .link { color: #3b82f6; text-decoration: none; }
      .link:hover { text-decoration: underline; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
      .badge-primary { background-color: #eff6ff; color: #1e40af; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f3f4f6">
    <!-- Header -->
    <mj-section background-color="#1e293b" padding="32px 24px">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="700" color="#ffffff">
          🧠 Neurmatic
        </mj-text>
        <mj-text align="center" font-size="16px" color="#94a3b8" padding-top="8px">
          Your Daily LLM Digest
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Greeting -->
    <mj-section background-color="#ffffff" padding="32px 24px 24px">
      <mj-column>
        <mj-text font-size="18px" font-weight="600" color="#111827">
          Good morning, ${user.firstName}!
        </mj-text>
        <mj-text padding-top="12px" color="#6b7280">
          Here's your personalized digest for ${date}.
        </mj-text>
      </mj-column>
    </mj-section>

    ${content.topStories && content.topStories.length > 0 ? generateTopStoriesSection(content.topStories, frontendUrl) : ''}

    ${content.trendingDiscussions && content.trendingDiscussions.length > 0 ? generateTrendingSection(content.trendingDiscussions, frontendUrl) : ''}

    ${content.jobMatches && content.jobMatches.length > 0 ? generateJobMatchesSection(content.jobMatches, frontendUrl) : ''}

    ${content.activitySummary ? generateActivitySection(content.activitySummary, frontendUrl) : ''}

    <!-- Footer -->
    <mj-section background-color="#f9fafb" padding="32px 24px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#6b7280" padding-bottom="12px">
          <a href="${frontendUrl}/settings/notifications" class="link">Manage your digest preferences</a>
        </mj-text>
        <mj-text align="center" font-size="12px" color="#9ca3af">
          <a href="${frontendUrl}/digest/unsubscribe?token=${unsubscribeToken}" style="color: #9ca3af;">Unsubscribe from digests</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#9ca3af" padding-top="16px">
          © ${new Date().getFullYear()} Neurmatic. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Tracking Pixel -->
    <mj-section padding="0">
      <mj-column>
        <mj-image src="${frontendUrl}/api/v1/notifications/digest/track/open/${trackingToken}" width="1px" height="1px" alt="" />
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `;

  const { html } = mjml2html(mjml, {
    minify: true,
    validationLevel: 'soft',
  });

  return html;
}

/**
 * Generate weekly digest email HTML
 */
export function generateWeeklyDigest(data: DigestData): string {
  const { user, content, unsubscribeToken, trackingToken, date } = data;
  const frontendUrl = unifiedConfig.server.frontendUrl;

  const mjml = `
<mjml>
  <mj-head>
    <mj-title>Your Weekly Neurmatic Digest</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" />
      <mj-text font-size="14px" line-height="1.6" color="#374151" />
      <mj-section padding="20px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f3f4f6">
    <!-- Header -->
    <mj-section background-color="#1e293b" padding="32px 24px">
      <mj-column>
        <mj-text align="center" font-size="28px" font-weight="700" color="#ffffff">
          🧠 Neurmatic
        </mj-text>
        <mj-text align="center" font-size="16px" color="#94a3b8" padding-top="8px">
          Your Weekly LLM Digest
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Greeting -->
    <mj-section background-color="#ffffff" padding="32px 24px 24px">
      <mj-column>
        <mj-text font-size="18px" font-weight="600" color="#111827">
          Hi ${user.firstName}!
        </mj-text>
        <mj-text padding-top="12px" color="#6b7280">
          Here's your weekly roundup of the best LLM content and opportunities.
        </mj-text>
      </mj-column>
    </mj-section>

    ${content.topStories && content.topStories.length > 0 ? generateTopStoriesSection(content.topStories, frontendUrl) : ''}

    ${content.trendingDiscussions && content.trendingDiscussions.length > 0 ? generateTrendingSection(content.trendingDiscussions, frontendUrl) : ''}

    ${content.jobMatches && content.jobMatches.length > 0 ? generateJobMatchesSection(content.jobMatches, frontendUrl) : ''}

    ${content.activitySummary ? generateActivitySection(content.activitySummary, frontendUrl) : ''}

    <!-- Footer -->
    <mj-section background-color="#f9fafb" padding="32px 24px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#6b7280" padding-bottom="12px">
          <a href="${frontendUrl}/settings/notifications" class="link">Manage your digest preferences</a>
        </mj-text>
        <mj-text align="center" font-size="12px" color="#9ca3af">
          <a href="${frontendUrl}/digest/unsubscribe?token=${unsubscribeToken}" style="color: #9ca3af;">Unsubscribe from digests</a>
        </mj-text>
        <mj-text align="center" font-size="11px" color="#9ca3af" padding-top="16px">
          © ${new Date().getFullYear()} Neurmatic. All rights reserved.
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Tracking Pixel -->
    <mj-section padding="0">
      <mj-column>
        <mj-image src="${frontendUrl}/api/v1/notifications/digest/track/open/${trackingToken}" width="1px" height="1px" alt="" />
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `;

  const { html } = mjml2html(mjml, {
    minify: true,
    validationLevel: 'soft',
  });

  return html;
}

// Helper functions to generate sections

function generateTopStoriesSection(stories: DigestContent['topStories'], frontendUrl: string): string {
  if (!stories || stories.length === 0) return '';

  const storyItems = stories
    .map(
      (story) => `
    <mj-section background-color="#ffffff" padding="8px 24px">
      <mj-column>
        ${story.imageUrl ? `<mj-image src="${story.imageUrl}" alt="${story.title}" border-radius="8px" padding-bottom="12px" />` : ''}
        <mj-text font-size="16px" font-weight="600" color="#111827" padding-bottom="8px">
          <a href="${frontendUrl}${story.url}?utm_source=digest&utm_medium=email" class="link" style="color: #111827;">${story.title}</a>
        </mj-text>
        <mj-text font-size="14px" color="#6b7280" padding-bottom="8px">
          ${story.excerpt}
        </mj-text>
        <mj-text font-size="12px" color="#9ca3af">
          By ${story.author} • ${story.category} • ${formatDate(story.publishedAt)}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="0 24px">
      <mj-column>
        <mj-divider border-color="#e5e7eb" border-width="1px" padding="16px 0" />
      </mj-column>
    </mj-section>
  `
    )
    .join('');

  return `
    <mj-section background-color="#ffffff" padding="24px 24px 8px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827">
          📰 Top Stories
        </mj-text>
      </mj-column>
    </mj-section>
    ${storyItems}
  `;
}

function generateTrendingSection(discussions: DigestContent['trendingDiscussions'], frontendUrl: string): string {
  if (!discussions || discussions.length === 0) return '';

  const discussionItems = discussions
    .map(
      (discussion) => `
    <mj-section background-color="#ffffff" padding="8px 24px">
      <mj-column>
        <mj-text font-size="16px" font-weight="600" color="#111827" padding-bottom="8px">
          <a href="${frontendUrl}${discussion.url}?utm_source=digest&utm_medium=email" class="link" style="color: #111827;">${discussion.title}</a>
        </mj-text>
        <mj-text font-size="12px" color="#6b7280">
          by ${discussion.author} • ${discussion.category}
        </mj-text>
        <mj-text font-size="12px" color="#9ca3af" padding-top="4px">
          ${discussion.replyCount} replies • ${discussion.viewCount} views • Active ${formatDate(discussion.lastActivityAt)}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="0 24px">
      <mj-column>
        <mj-divider border-color="#e5e7eb" border-width="1px" padding="12px 0" />
      </mj-column>
    </mj-section>
  `
    )
    .join('');

  return `
    <mj-section background-color="#ffffff" padding="24px 24px 8px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827">
          💬 Trending Discussions
        </mj-text>
      </mj-column>
    </mj-section>
    ${discussionItems}
  `;
}

function generateJobMatchesSection(jobs: DigestContent['jobMatches'], frontendUrl: string): string {
  if (!jobs || jobs.length === 0) return '';

  const jobItems = jobs
    .map(
      (job) => `
    <mj-section background-color="#ffffff" padding="8px 24px">
      <mj-column>
        <mj-text font-size="16px" font-weight="600" color="#111827" padding-bottom="4px">
          <a href="${frontendUrl}${job.url}?utm_source=digest&utm_medium=email" class="link" style="color: #111827;">${job.title}</a>
        </mj-text>
        <mj-text font-size="14px" color="#6b7280" padding-bottom="4px">
          ${job.company} • ${job.location} • ${job.type}
        </mj-text>
        ${job.salary ? `<mj-text font-size="14px" color="#059669" font-weight="600" padding-bottom="4px">${job.salary}</mj-text>` : ''}
        <mj-text font-size="12px" color="#3b82f6" font-weight="600">
          ${job.matchScore}% Match
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="0 24px">
      <mj-column>
        <mj-divider border-color="#e5e7eb" border-width="1px" padding="12px 0" />
      </mj-column>
    </mj-section>
  `
    )
    .join('');

  return `
    <mj-section background-color="#ffffff" padding="24px 24px 8px">
      <mj-column>
        <mj-text font-size="20px" font-weight="700" color="#111827">
          💼 New Job Matches
        </mj-text>
      </mj-column>
    </mj-section>
    ${jobItems}
  `;
}

function generateActivitySection(activity: DigestContent['activitySummary'], frontendUrl: string): string {
  if (!activity) return '';

  const stats = [];
  if (activity.newFollowers > 0) stats.push(`${activity.newFollowers} new followers`);
  if (activity.topicReplies > 0) stats.push(`${activity.topicReplies} replies to your topics`);
  if (activity.upvotes > 0) stats.push(`${activity.upvotes} upvotes`);
  if (activity.badgesEarned > 0) stats.push(`${activity.badgesEarned} badges earned`);

  if (stats.length === 0) return '';

  return `
    <mj-section background-color="#f0f9ff" padding="24px">
      <mj-column>
        <mj-text font-size="18px" font-weight="600" color="#111827" padding-bottom="12px">
          📊 Your Activity Summary
        </mj-text>
        <mj-text font-size="14px" color="#374151">
          ${stats.join(' • ')}
        </mj-text>
        <mj-button href="${frontendUrl}/profile/activity?utm_source=digest&utm_medium=email" background-color="#3b82f6" color="#ffffff" font-weight="600" padding-top="16px" border-radius="6px">
          View Your Activity
        </mj-button>
      </mj-column>
    </mj-section>
  `;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
