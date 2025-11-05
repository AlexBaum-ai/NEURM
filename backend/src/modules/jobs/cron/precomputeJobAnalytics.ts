import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import * as Sentry from '@sentry/node';
import { ApplicationStatus } from '@prisma/client';

/**
 * Cron job to precompute daily analytics for all active jobs
 * Run daily at 2:00 AM
 */
export async function precomputeJobAnalytics(): Promise<void> {
  logger.info('Starting daily job analytics precomputation');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get all active jobs
    const jobs = await prisma.job.findMany({
      where: {
        status: {
          in: ['draft', 'active', 'paused'],
        },
      },
      include: {
        applications: {
          where: {
            appliedAt: {
              gte: yesterday,
              lt: today,
            },
          },
          include: {
            user: {
              include: {
                reputation: true,
                userModels: true,
              },
            },
          },
        },
        matches: {
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
        },
      },
    });

    logger.info(`Precomputing analytics for ${jobs.length} jobs`);

    let successCount = 0;
    let failureCount = 0;

    for (const job of jobs) {
      try {
        // Calculate metrics for yesterday
        const totalViews = job.viewCount; // Would need to track daily views separately
        const totalApplications = job.applications.length;
        const conversionRate =
          totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;

        // Calculate average match score
        const avgMatchScore =
          job.matches.length > 0
            ? job.matches.reduce(
                (sum, match) => sum + Number(match.matchScore),
                0
              ) / job.matches.length
            : null;

        // Calculate applicant quality score
        const applicantQualityScore = calculateApplicantQualityScore(
          job.applications
        );

        // Calculate time to hire
        const timeToHireDays = await calculateTimeToHire(job.id);

        // Get top traffic sources
        const topTrafficSources = getTopTrafficSources(job.applications);

        // Calculate funnel data
        const funnelData = calculateFunnelData(job.applications);

        // Calculate demographics
        const demographicsData = calculateDemographics(job.applications);

        // Upsert analytics record
        await prisma.jobAnalytics.upsert({
          where: {
            jobId_date: {
              jobId: job.id,
              date: yesterday,
            },
          },
          create: {
            jobId: job.id,
            date: yesterday,
            totalViews,
            totalApplications,
            conversionRate,
            avgMatchScore,
            applicantQualityScore,
            timeToHireDays,
            topTrafficSources,
            funnelData,
            demographicsData,
          },
          update: {
            totalViews,
            totalApplications,
            conversionRate,
            avgMatchScore,
            applicantQualityScore,
            timeToHireDays,
            topTrafficSources,
            funnelData,
            demographicsData,
          },
        });

        successCount++;
      } catch (error) {
        failureCount++;
        logger.error('Error precomputing analytics for job', {
          jobId: job.id,
          error,
        });
        Sentry.captureException(error, {
          tags: { operation: 'precompute_job_analytics' },
          extra: { jobId: job.id },
        });
      }
    }

    logger.info('Job analytics precomputation completed', {
      successCount,
      failureCount,
      totalJobs: jobs.length,
    });
  } catch (error) {
    logger.error('Error in job analytics precomputation cron', {
      error,
    });
    Sentry.captureException(error, {
      tags: { operation: 'precompute_job_analytics_cron' },
    });

    throw error;
  }
}

/**
 * Calculate applicant quality score
 */
function calculateApplicantQualityScore(applications: any[]): number | null {
  if (applications.length === 0) return null;

  const scores = applications.map((app) => {
    const matchScore = app.user?.userModels?.length || 0;
    const experienceMatch = 75; // Placeholder
    const forumReputation = app.user?.reputation?.totalReputation || 0;

    return (
      matchScore * 0.5 +
      experienceMatch * 0.3 +
      Math.min(forumReputation / 10, 100) * 0.2
    );
  });

  const avgScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Number(avgScore.toFixed(2));
}

/**
 * Calculate time to hire for a job
 */
async function calculateTimeToHire(jobId: string): Promise<number | null> {
  const hiredApplication = await prisma.jobApplication.findFirst({
    where: {
      jobId,
      status: ApplicationStatus.offer,
    },
    orderBy: { appliedAt: 'asc' },
  });

  if (!hiredApplication) return null;

  return Math.floor(
    (new Date(hiredApplication.updatedAt).getTime() -
      new Date(hiredApplication.appliedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

/**
 * Get top traffic sources
 */
function getTopTrafficSources(applications: any[]): any {
  if (applications.length === 0) return [];

  const sources = new Map<string, number>();

  applications.forEach((app) => {
    const source = app.source || 'direct';
    sources.set(source, (sources.get(source) || 0) + 1);
  });

  return Array.from(sources.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: Number(((count / applications.length) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Calculate funnel data
 */
function calculateFunnelData(applications: any[]): any {
  const total = applications.length;

  if (total === 0) return {};

  const statusCounts = {
    viewed: total,
    applied: applications.filter((app) => app.status !== undefined).length,
    screening: applications.filter(
      (app) => app.status === ApplicationStatus.screening
    ).length,
    interview: applications.filter(
      (app) => app.status === ApplicationStatus.interview
    ).length,
    offer: applications.filter((app) => app.status === ApplicationStatus.offer)
      .length,
    rejected: applications.filter(
      (app) => app.status === ApplicationStatus.rejected
    ).length,
  };

  return {
    stages: [
      { stage: 'viewed', count: statusCounts.viewed, percentage: 100 },
      {
        stage: 'applied',
        count: statusCounts.applied,
        percentage: (statusCounts.applied / total) * 100,
      },
      {
        stage: 'screening',
        count: statusCounts.screening,
        percentage: (statusCounts.screening / total) * 100,
      },
      {
        stage: 'interview',
        count: statusCounts.interview,
        percentage: (statusCounts.interview / total) * 100,
      },
      {
        stage: 'offer',
        count: statusCounts.offer,
        percentage: (statusCounts.offer / total) * 100,
      },
    ],
    rejectionRate: Number(((statusCounts.rejected / total) * 100).toFixed(2)),
  };
}

/**
 * Calculate demographics
 */
function calculateDemographics(applications: any[]): any {
  if (applications.length === 0) return {};

  // Location distribution
  const locations = new Map<string, number>();
  applications.forEach((app) => {
    const location = app.user?.profile?.location || 'Unknown';
    locations.set(location, (locations.get(location) || 0) + 1);
  });

  // Models expertise
  const modelsExpertise = new Map<string, number>();
  applications.forEach((app) => {
    app.user?.userModels?.forEach((userModel: any) => {
      const modelName = userModel.model?.name || 'Unknown';
      modelsExpertise.set(modelName, (modelsExpertise.get(modelName) || 0) + 1);
    });
  });

  return {
    location: Array.from(locations.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: Number(((count / applications.length) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    modelsExpertise: Array.from(modelsExpertise.entries())
      .map(([model, count]) => ({
        model,
        count,
        percentage: Number(((count / applications.length) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}
