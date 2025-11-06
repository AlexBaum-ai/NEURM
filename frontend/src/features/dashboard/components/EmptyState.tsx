import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, MessageCircle, Briefcase, Users } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const steps = [
    {
      icon: BookOpen,
      title: 'Read Articles',
      description: 'Explore our curated LLM news and tutorials',
      link: '/news',
      linkText: 'Browse News',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: MessageCircle,
      title: 'Join Discussions',
      description: 'Ask questions and share your knowledge',
      link: '/forum',
      linkText: 'Visit Forum',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Briefcase,
      title: 'Find Jobs',
      description: 'Discover LLM-focused opportunities',
      link: '/jobs',
      linkText: 'Search Jobs',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Users,
      title: 'Follow People',
      description: 'Stay updated with community leaders',
      link: '/search?type=users',
      linkText: 'Find People',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto text-center">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
            <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to Neurmatic!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your personalized dashboard will come alive as you engage with our community.
            Here's how to get started:
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-left hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${step.bgColor} mb-4`}>
                  <Icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {step.description}
                </p>
                <Link
                  to={step.link}
                  className={`inline-flex items-center text-sm font-medium ${step.color} hover:underline`}
                >
                  {step.linkText} →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Additional Tips */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-left">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">✓</span>
              <span>
                Your dashboard will show personalized content based on your activity
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">✓</span>
              <span>
                Use the "Customize" button to toggle widgets and rearrange your layout
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">✓</span>
              <span>
                Follow topics and users to get relevant updates in your feed
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
