import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Helmet } from 'react-helmet-async';
import { useModel } from '../hooks/useModels';
import ModelHero from '../components/ModelHero';
import ModelStats from '../components/ModelStats';
import ModelFollowButton from '../components/ModelFollowButton';
import { ModelOverview, ModelNews, ModelDiscussions, ModelJobs, ModelSpecs } from '../components/tabs';
import { Card, CardContent } from '@/components/common/Card/Card';

const ModelDetailPageContent: React.FC<{ slug: string }> = ({ slug }) => {
  const { data: model } = useModel(slug);

  const tabs = [
    { value: 'overview', label: 'Overview', icon: '📋' },
    { value: 'news', label: 'News', icon: '📰' },
    { value: 'discussions', label: 'Discussions', icon: '💬' },
    { value: 'jobs', label: 'Jobs', icon: '💼' },
    { value: 'specs', label: 'Specs', icon: '⚙️' },
  ];

  return (
    <>
      <Helmet>
        <title>{model.name} - Model Tracker | Neurmatic</title>
        <meta name="description" content={model.description} />
      </Helmet>

      {/* Hero Section */}
      <ModelHero model={model} />

      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Stats and Follow Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Model Information
          </h2>
          <ModelFollowButton model={model} />
        </div>

        <ModelStats model={model} />

        {/* Tabs */}
        <Tabs.Root defaultValue="overview" className="mt-8">
          {/* Tab List */}
          <Tabs.List className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Tab Contents */}
          <Tabs.Content value="overview" className="focus:outline-none">
            <ModelOverview model={model} />
          </Tabs.Content>

          <Tabs.Content value="news" className="focus:outline-none">
            <ModelNews modelSlug={model.slug} />
          </Tabs.Content>

          <Tabs.Content value="discussions" className="focus:outline-none">
            <ModelDiscussions modelSlug={model.slug} />
          </Tabs.Content>

          <Tabs.Content value="jobs" className="focus:outline-none">
            <ModelJobs modelSlug={model.slug} />
          </Tabs.Content>

          <Tabs.Content value="specs" className="focus:outline-none">
            <ModelSpecs model={model} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </>
  );
};

export const ModelDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div className="container-custom py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400">
              Invalid model slug
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          {/* Hero Skeleton */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="container-custom py-12">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="container-custom py-8">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <ModelDetailPageContent slug={slug} />
    </Suspense>
  );
};

export default ModelDetailPage;
