import React from 'react';
import { GraduationCap, Calendar, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { UserProfile, Education } from '../types';

interface EducationSectionProps {
  profile: UserProfile;
}

const EducationCard: React.FC<{ education: Education }> = ({ education }) => {
  const { institution, degree, fieldOfStudy, startDate, endDate, description } = education;

  const formatDate = (date: string) => {
    return new Date(date).getFullYear().toString();
  };

  return (
    <div className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-0 w-4 h-4 -ml-[9px] rounded-full bg-secondary-500 border-2 border-white dark:border-gray-900"></div>

      <div className="space-y-3">
        {/* Degree & Field */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {degree}
          </h3>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <GraduationCap className="w-4 h-4" />
            <span className="font-medium">{institution}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {fieldOfStudy}
          </p>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : 'Present'}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export const EducationSection: React.FC<EducationSectionProps> = ({ profile }) => {
  const { education, privacy, isOwner } = profile;

  // Check if education is visible
  const isVisible = !privacy || privacy.education === 'public' || isOwner;

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Education</CardTitle>
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

  // Sort by end date descending (most recent first), with ongoing education at top
  const sortedEducation = [...education].sort((a, b) => {
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    if (!a.endDate && !b.endDate) return 0;
    return new Date(b.endDate!).getTime() - new Date(a.endDate!).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Education</CardTitle>
          {privacy?.education !== 'public' && isOwner && privacy && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="capitalize">{privacy.education}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {education.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No education added yet
          </p>
        ) : (
          <div className="space-y-0">
            {sortedEducation.map((edu) => (
              <EducationCard key={edu.id} education={edu} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EducationSection;
