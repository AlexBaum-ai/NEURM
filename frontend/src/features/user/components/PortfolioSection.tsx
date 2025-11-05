import React from 'react';
import { ExternalLink, Github, Star, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { UserProfile, PortfolioProject } from '../types';
import { cn } from '@/lib/utils';

interface PortfolioSectionProps {
  profile: UserProfile;
}

const PortfolioCard: React.FC<{ project: PortfolioProject }> = ({ project }) => {
  const {
    title,
    description,
    techStack,
    projectUrl,
    githubUrl,
    demoUrl,
    thumbnailUrl,
    isFeatured,
  } = project;

  return (
    <div className={cn(
      "group relative rounded-lg border overflow-hidden transition-all hover:shadow-lg",
      isFeatured
        ? "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    )}>
      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
          <Star className="w-3 h-3 fill-current" />
          Featured
        </div>
      )}

      {/* Thumbnail */}
      {thumbnailUrl ? (
        <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
          <span className="text-4xl font-bold text-white opacity-50">
            {title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
            {description}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              aria-label="View project"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Live Demo</span>
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="View on GitHub"
            >
              <Github className="w-4 h-4" />
              <span>Code</span>
            </a>
          )}
          {demoUrl && !projectUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              aria-label="View demo"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Demo</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ profile }) => {
  const { portfolio, privacy, isOwner } = profile;

  // Check if portfolio is visible
  const isVisible = !privacy || privacy.portfolio === 'public' || isOwner;

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio</CardTitle>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Private</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 italic">
            This section is private
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by featured first, then by display order
  const sortedPortfolio = [...portfolio].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return a.displayOrder - b.displayOrder;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio</CardTitle>
          {privacy?.portfolio !== 'public' && isOwner && privacy && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="capitalize">{privacy.portfolio}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {portfolio.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No portfolio projects added yet
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedPortfolio.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioSection;
