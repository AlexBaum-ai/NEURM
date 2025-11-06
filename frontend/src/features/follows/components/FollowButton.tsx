import React, { Suspense } from 'react';
import { Button } from '@/components/common/Button/Button';
import { useFollow, useUnfollow, useFollowStatus } from '../hooks/useFollows';
import type { FollowEntityType } from '../types';

interface FollowButtonProps {
  entityType: FollowEntityType;
  entityId: number;
  entityName?: string;
  followerCount?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const FollowButtonContent: React.FC<FollowButtonProps> = ({
  entityType,
  entityId,
  entityName,
  followerCount = 0,
  variant = 'default',
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const { data: followStatus } = useFollowStatus(entityType, entityId);
  const followMutation = useFollow(entityType, entityId);
  const unfollowMutation = useUnfollow(
    followStatus?.followId || 0,
    entityType,
    entityId
  );

  const isFollowing = followStatus?.isFollowing || false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleToggleFollow = () => {
    if (isFollowing && followStatus?.followId) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const buttonVariant = isFollowing ? 'outline' : variant;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        onClick={handleToggleFollow}
        disabled={isPending}
        variant={buttonVariant}
        size={size}
        className="min-w-[100px]"
        aria-label={isFollowing ? `Unfollow ${entityName || ''}` : `Follow ${entityName || ''}`}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
            <span>{isFollowing ? 'Unfollowing...' : 'Following...'}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {isFollowing ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Following</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Follow</span>
              </>
            )}
          </span>
        )}
      </Button>
      {showCount && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">{followerCount.toLocaleString()}</span>{' '}
          {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
};

// Wrapper with Suspense
export const FollowButton: React.FC<FollowButtonProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3">
          <Button disabled variant="outline" size={props.size || 'md'} className="min-w-[100px]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
              <span>Loading...</span>
            </span>
          </Button>
        </div>
      }
    >
      <FollowButtonContent {...props} />
    </Suspense>
  );
};

export default FollowButton;
