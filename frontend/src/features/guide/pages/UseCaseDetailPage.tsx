import React, { Suspense, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Eye,
  MessageSquare,
  Code,
  TrendingUp,
  ArrowLeft,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUseCaseDetail } from '../hooks/useUseCases';
import UseCaseCard from '../components/UseCaseCard';
import type { TableOfContentsItem } from '../types';

// Table of Contents Component
const TableOfContents: React.FC<{ items: TableOfContentsItem[] }> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-24">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Table of Contents
      </h3>
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={cn(
              'block w-full text-left text-sm py-1.5 px-3 rounded transition-colors',
              item.level === 2 && 'pl-6',
              item.level === 3 && 'pl-9',
              activeId === item.id
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  );
};

const UseCaseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useUseCaseDetail(slug!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600 dark:text-gray-400">Use case not found.</p>
        </div>
      </div>
    );
  }

  const { useCase, relatedUseCases } = data.data;

  // Generate TOC items from content sections
  const tocItems: TableOfContentsItem[] = [
    { id: 'quick-summary', text: 'Quick Summary', level: 1 },
    useCase.problemStatement && { id: 'problem', text: 'The Problem', level: 1 },
    useCase.solutionDescription && { id: 'solution', text: 'Solution', level: 1 },
    useCase.architectureDetails && { id: 'architecture', text: 'Architecture', level: 1 },
    useCase.implementationDetails && { id: 'implementation', text: 'Implementation', level: 1 },
    useCase.resultsMetrics && useCase.resultsMetrics.length > 0 && { id: 'results', text: 'Results', level: 1 },
    useCase.challengesFaced && { id: 'challenges', text: 'Challenges', level: 1 },
    useCase.lessonsLearned && { id: 'lessons', text: 'Learnings', level: 1 },
    useCase.recommendedPractices && { id: 'tips', text: 'Recommended Practices', level: 1 },
    useCase.resourceLinks && { id: 'resources', text: 'Resources', level: 1 },
  ].filter(Boolean) as TableOfContentsItem[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/guide/use-cases"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Use Cases
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {useCase.title}
          </h1>

          {useCase.companyName && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-4">
              <Building2 className="h-5 w-5" />
              <span className="font-medium">{useCase.companyName}</span>
              <span className="text-gray-400">•</span>
              <span>{useCase.industry}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{useCase.viewCount} views</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{useCase.commentCount} comments</span>
            </div>
            {useCase.hasCode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                <Code className="h-3 w-3" />
                Code included
              </span>
            )}
            <button className="ml-auto inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
              {/* Quick Summary */}
              <section id="quick-summary" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Quick Summary
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{useCase.summary}</p>

                {/* Tech Stack */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tech Stack:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {useCase.techStack.map((tech) => (
                      <Link
                        key={tech.id}
                        to={`/guide/use-cases?tech=${tech.slug}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-800"
                      >
                        {tech.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Implementation Type */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {useCase.implementationType.replace(/_/g, ' ')}
                  </span>
                </div>
              </section>

              {/* Problem Statement */}
              {useCase.problemStatement && (
                <section id="problem" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    The Problem
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.problemStatement }}
                  />
                </section>
              )}

              {/* Solution */}
              {useCase.solutionDescription && (
                <section id="solution" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Solution
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.solutionDescription }}
                  />
                </section>
              )}

              {/* Architecture */}
              {useCase.architectureDetails && (
                <section id="architecture" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Architecture
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.architectureDetails }}
                  />
                </section>
              )}

              {/* Implementation */}
              {useCase.implementationDetails && (
                <section id="implementation" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Implementation
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.implementationDetails }}
                  />
                </section>
              )}

              {/* Results */}
              {useCase.resultsMetrics && useCase.resultsMetrics.length > 0 && (
                <section id="results" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Results
                  </h2>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 space-y-3">
                    {useCase.resultsMetrics.map((metric, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-green-900 dark:text-green-100">
                            {metric.metric}
                          </div>
                          <div className="text-green-700 dark:text-green-300">
                            {metric.value}
                            {metric.improvement && (
                              <span className="ml-2 text-sm">({metric.improvement})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Challenges */}
              {useCase.challengesFaced && (
                <section id="challenges" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Challenges
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.challengesFaced }}
                  />
                </section>
              )}

              {/* Learnings */}
              {useCase.lessonsLearned && (
                <section id="lessons" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Learnings
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.lessonsLearned }}
                  />
                </section>
              )}

              {/* Recommended Practices */}
              {useCase.recommendedPractices && (
                <section id="tips" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Recommended Practices
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.recommendedPractices }}
                  />
                </section>
              )}

              {/* Resources */}
              {useCase.resourceLinks && (
                <section id="resources" className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Resources
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: useCase.resourceLinks }}
                  />
                </section>
              )}

              {/* Related Models */}
              {useCase.relatedModels.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Related Models
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {useCase.relatedModels.map((model) => (
                      <Link
                        key={model.id}
                        to={`/guide/models/${model.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {model.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Jobs */}
              {useCase.relatedJobs && useCase.relatedJobs.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Related Job Opportunities
                  </h3>
                  <div className="space-y-2">
                    {useCase.relatedJobs.map((job) => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.slug}`}
                        className="block px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {job.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Comments ({useCase.commentCount})
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Comments section will be implemented in a future sprint.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TableOfContents items={tocItems} />

            {/* Related Use Cases */}
            {relatedUseCases.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Related Use Cases
                </h3>
                <div className="space-y-4">
                  {relatedUseCases.map((related) => (
                    <UseCaseCard key={related.id} useCase={related} className="text-sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseDetailPage;
