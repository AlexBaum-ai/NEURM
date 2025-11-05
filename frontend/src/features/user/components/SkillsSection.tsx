import React from 'react';
import { Lock, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { UserProfile, UserSkill } from '../types';
import { cn } from '@/lib/utils';

interface SkillsSectionProps {
  profile: UserProfile;
}

const SkillCard: React.FC<{ skill: UserSkill }> = ({ skill }) => {
  const { name, category, proficiency, endorsementCount } = skill;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-all hover:border-primary-300 dark:hover:border-primary-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {category.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Proficiency stars */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <Star
            key={level}
            className={cn(
              'w-4 h-4',
              level <= proficiency
                ? 'text-primary-500 fill-primary-500'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </div>

      {/* Endorsements */}
      {endorsementCount !== undefined && endorsementCount > 0 && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {endorsementCount} {endorsementCount === 1 ? 'endorsement' : 'endorsements'}
        </p>
      )}
    </div>
  );
};

export const SkillsSection: React.FC<SkillsSectionProps> = ({ profile }) => {
  const { skills, privacy, isOwner } = profile;

  // Check if skills are visible
  const isVisible = !privacy || privacy.skills === 'public' || isOwner;

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skills</CardTitle>
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

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, UserSkill[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Skills</CardTitle>
          {privacy?.skills !== 'public' && isOwner && privacy && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="capitalize">{privacy.skills}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No skills added yet
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                  {category.replace(/_/g, ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categorySkills
                    .sort((a, b) => b.proficiency - a.proficiency)
                    .map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillsSection;
