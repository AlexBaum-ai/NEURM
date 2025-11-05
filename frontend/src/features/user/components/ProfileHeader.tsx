import React from 'react';
import { MapPin, Link as LinkIcon, Calendar, Edit, Award, MessageSquare, Briefcase } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { UserProfile } from '../types';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditClick }) => {
  const {
    displayName,
    username,
    headline,
    location,
    website,
    avatar,
    coverImage,
    stats,
    createdAt,
    isOwner,
    socialLinks,
  } = profile;

  const formatJoinDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(date)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary-500 to-secondary-500">
        {coverImage && (
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-4 md:px-6 pb-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 md:-mt-20 mb-4">
          <div className="flex items-end space-x-4">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName || username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-bold text-gray-400 dark:text-gray-500">
                    {(displayName || username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Button (only for owner) */}
          {isOwner && (
            <div className="mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="w-full sm:w-auto"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Name and Headline */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {displayName || username}
          </h1>
          {displayName && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">@{username}</p>
          )}
          {headline && (
            <p className="text-lg text-gray-700 dark:text-gray-300">{headline}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>{new URL(website).hostname}</span>
            </a>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatJoinDate(createdAt)}</span>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks && Object.values(socialLinks).some(link => link) && (
          <div className="flex gap-3 mb-6">
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.reputation}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Award className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.badgeCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <MessageSquare className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.contributionsCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Contributions</p>
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.followersCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
