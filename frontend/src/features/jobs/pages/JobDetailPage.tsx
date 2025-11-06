import React, { useState, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  Star,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { useJob, useRelatedJobs, useSaveJob, useUnsaveJob, useJobMatch } from '../hooks';
import { ShareButtons } from '../components/ShareButtons';
import { JobCard } from '../components/JobCard';
import { ApplyModal } from '../components/apply';
import { MatchExplanation, MatchBreakdown, MatchBadge } from '../components/matching';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { Card } from '@/components/common/Card/Card';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow, format } from 'date-fns';
import type { JobSkill } from '../types';
import { cn } from '@/lib/utils';
import { RecommendationsSection } from '@/features/recommendations';

const experienceLevelLabels = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
};

const employmentTypeLabels = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  freelance: 'Freelance',
  internship: 'Internship',
};

const locationTypeLabels = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  on_site: 'On-site',
};

const SkillLevel: React.FC<{ skill: JobSkill }> = ({ skill }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {skill.skillName}
      </span>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < skill.requiredLevel
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export const JobDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const { data: job, isLoading, error } = useJob(slug!);
  const { data: relatedJobs } = useRelatedJobs(slug!);
  const { data: jobMatch } = useJobMatch(slug!, isAuthenticated);

  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container-custom py-12">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Job not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button as="a" href="/jobs">
            Browse All Jobs
          </Button>
        </Card>
      </div>
    );
  }

  const handleSaveToggle = () => {
    if (job.isSaved) {
      unsaveJobMutation.mutate(job.slug);
    } else {
      saveJobMutation.mutate({ slug: job.slug });
    }
  };

  const salaryDisplay = job.salaryIsPublic && (job.salaryMin || job.salaryMax)
    ? `${job.salaryCurrency} ${job.salaryMin ? (job.salaryMin / 1000).toFixed(0) + 'k' : ''}${
        job.salaryMin && job.salaryMax ? ' - ' : ''
      }${job.salaryMax ? (job.salaryMax / 1000).toFixed(0) + 'k' : ''}`
    : null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Generate JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt,
    validThrough: job.applicationDeadline || undefined,
    employmentType: job.employmentType.toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.companyName,
      sameAs: job.company.websiteUrl,
      logo: job.company.logoUrl,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    baseSalary: job.salaryIsPublic && job.salaryMin
      ? {
          '@type': 'MonetaryAmount',
          currency: job.salaryCurrency,
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: 'YEAR',
          },
        }
      : undefined,
  };

  return (
    <>
      <Helmet>
        <title>{`${job.title} at ${job.company.companyName} | Neurmatic`}</title>
        <meta name="description" content={job.description.substring(0, 160)} />
        <meta property="og:title" content={`${job.title} at ${job.company.companyName}`} />
        <meta property="og:description" content={job.description.substring(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        {job.company.logoUrl && <meta property="og:image" content={job.company.logoUrl} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="container-custom py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/jobs" className="hover:text-primary-600 dark:hover:text-primary-400">
            Jobs
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start gap-4 mb-4">
                {job.company.logoUrl ? (
                  <img
                    src={job.company.logoUrl}
                    alt={`${job.company.companyName} logo`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <Link
                    to={`/companies/${job.company.slug}`}
                    className="text-lg text-primary-600 dark:text-primary-400 hover:underline">
                    {job.company.companyName}
                  </Link>
                </div>
              </div>

              {/* Job Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location} • {locationTypeLabels[job.locationType]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>{experienceLevelLabels[job.experienceLevel]}</span>
                </div>
                {salaryDisplay && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{salaryDisplay}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{employmentTypeLabels[job.employmentType]}</Badge>
                {job.hasVisaSponsorship && (
                  <Badge variant="success">Visa Sponsorship</Badge>
                )}
                {job.isFeatured && <Badge variant="default">Featured</Badge>}
                {/* Show match badge for authenticated users */}
                {isAuthenticated && job.matchScore !== undefined && job.matchScore > 0 && (
                  <MatchBadge matchScore={job.matchScore} />
                )}
              </div>
            </div>

            {/* Match Explanation (for authenticated users) */}
            {isAuthenticated && jobMatch && (
              <MatchExplanation
                topReasons={jobMatch.topReasons}
                matchScore={jobMatch.matchScore}
                lastUpdated={jobMatch.lastUpdated}
              />
            )}

            {/* Not authenticated - show CTA */}
            {!isAuthenticated && (
              <Card className="p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  See Your Match Score
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Create a profile to see how well this job matches your skills, experience, and preferences.
                </p>
                <Link to="/register">
                  <Button className="w-full">
                    Create Profile
                  </Button>
                </Link>
              </Card>
            )}

            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Job Description
                </h2>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            </Card>

            {/* Requirements */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Requirements
                </h2>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.requirements }}
                />
              </div>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Responsibilities
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.responsibilities }}
                  />
                </div>
              </Card>
            )}

            {/* Tech Stack */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Tech Stack
                </h2>
                <div className="space-y-4">
                  {job.primaryLlms.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        LLM Models
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.primaryLlms.map((llm) => (
                          <Badge key={llm} variant="tech">
                            {llm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.frameworks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Frameworks
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.frameworks.map((framework) => (
                          <Badge key={framework} variant="outline">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.programmingLanguages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Programming Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.programmingLanguages.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.vectorDatabases.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Vector Databases
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.vectorDatabases.map((db) => (
                          <Badge key={db} variant="secondary">
                            {db}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.infrastructure.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Infrastructure
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.infrastructure.map((infra) => (
                          <Badge key={infra} variant="secondary">
                            {infra}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Skills */}
            {job.skills.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Required Skills
                  </h2>
                  <div className="space-y-2">
                    {job.skills.map((skill, index) => (
                      <SkillLevel key={index} skill={skill} />
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Benefits
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
                  />
                </div>
              </Card>
            )}

            {/* Interview Process */}
            {job.interviewProcess && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Interview Process
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.interviewProcess }}
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply CTA */}
            <Card className="sticky top-4">
              <div className="p-6 space-y-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsApplyModalOpen(true)}
                  disabled={job.hasApplied}
                >
                  {job.hasApplied ? 'Applied' : 'Apply Now'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveToggle}
                  disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
                >
                  <Bookmark
                    className={cn(
                      'w-4 h-4 mr-2',
                      job.isSaved && 'fill-current'
                    )}
                  />
                  {job.isSaved ? 'Saved' : 'Save Job'}
                </Button>
                <ShareButtons url={currentUrl} title={job.title} />
              </div>
            </Card>

            {/* Match Breakdown (for authenticated users with detailed data) */}
            {isAuthenticated && jobMatch && jobMatch.factors.length > 0 && (
              <MatchBreakdown
                factors={jobMatch.factors}
                matchScore={jobMatch.matchScore}
              />
            )}

            {/* Company Info */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  About {job.company.companyName}
                </h3>
                {job.company.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {job.company.description}
                  </p>
                )}
                {job.company.companySize && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>{job.company.companySize} employees</span>
                  </div>
                )}
                {job.company.websiteUrl && (
                  <a
                    href={job.company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Visit website
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Link
                  to={`/companies/${job.company.slug}`}
                  className="block mt-4"
                >
                  <Button variant="outline" className="w-full">
                    View Company Profile
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Job Details */}
            <Card>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Job Details
                </h3>
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Posted</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {job.applicationDeadline && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {format(new Date(job.applicationDeadline), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Positions</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {job.positionsAvailable}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Applicants</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {job.applicationCount}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Views</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {job.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommended Jobs */}
        {isAuthenticated && (
          <Suspense fallback={null}>
            <RecommendationsSection
              type="job"
              excludeIds={[job.id]}
              limit={6}
              title="Recommended Jobs for You"
              className="mt-12"
            />
          </Suspense>
        )}

        {/* Related Jobs */}
        {relatedJobs && relatedJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Similar Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedJobs.map((relatedJob) => (
                <JobCard
                  key={relatedJob.id}
                  job={relatedJob}
                  onSave={(job) => saveJobMutation.mutate({ slug: job.slug })}
                  onUnsave={(job) => unsaveJobMutation.mutate(job.slug)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <ApplyModal
        job={job}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </>
  );
};
