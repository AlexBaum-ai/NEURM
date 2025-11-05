import React from 'react';
import { Briefcase, MapPin, Calendar, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { UserProfile, WorkExperience } from '../types';

interface ExperienceSectionProps {
  profile: UserProfile;
}

const ExperienceCard: React.FC<{ experience: WorkExperience }> = ({ experience }) => {
  const {
    title,
    company,
    location,
    employmentType,
    startDate,
    endDate,
    description,
    techStack,
    isCurrent,
  } = experience;

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
      new Date(date)
    );
  };

  const formatEmploymentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getDuration = () => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  };

  return (
    <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-0 w-4 h-4 -ml-[9px] rounded-full bg-primary-500 border-2 border-white dark:border-gray-900"></div>

      <div className="space-y-3">
        {/* Job Title & Company */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Briefcase className="w-4 h-4" />
            <span className="font-medium">{company}</span>
            {isCurrent && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                Current
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
            </span>
            <span className="text-gray-400">·</span>
            <span>{getDuration()}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
          <div className="text-gray-500 dark:text-gray-400">
            {formatEmploymentType(employmentType)}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        )}

        {/* Tech Stack */}
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ profile }) => {
  const { workExperience, privacy, isOwner } = profile;

  // Check if work experience is visible
  const isVisible = !privacy || privacy.workExperience === 'public' || isOwner;

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Work Experience</CardTitle>
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

  // Sort by current role first, then by start date descending
  const sortedExperience = [...workExperience].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Work Experience</CardTitle>
          {privacy?.workExperience !== 'public' && isOwner && privacy && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="capitalize">{privacy.workExperience}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {workExperience.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No work experience added yet
          </p>
        ) : (
          <div className="space-y-0">
            {sortedExperience.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperienceSection;
