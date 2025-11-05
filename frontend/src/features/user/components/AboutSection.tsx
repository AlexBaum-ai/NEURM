import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { UserProfile } from '../types';

interface AboutSectionProps {
  profile: UserProfile;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profile }) => {
  const { bio, email, privacy, isOwner } = profile;

  // Check if bio is visible based on privacy settings
  const isBioVisible = !privacy || privacy.bio === 'public' || isOwner;

  // Check if contact info is visible
  const isContactVisible = !privacy || privacy.contact === 'public' || isOwner;

  if (!isBioVisible && !isContactVisible) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>About</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>About</CardTitle>
          {privacy?.bio !== 'public' && isOwner && privacy && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="capitalize">{privacy.bio}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bio */}
        {isBioVisible && bio && (
          <div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {bio}
            </p>
          </div>
        )}

        {!bio && isBioVisible && (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No bio added yet
          </p>
        )}

        {/* Contact Information */}
        {isContactVisible && email && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AboutSection;
