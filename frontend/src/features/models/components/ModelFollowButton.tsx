import React from 'react';
import { Button } from '@/components/common/Button/Button';
import { useFollowModel } from '../hooks/useModels';
import type { Model } from '../types';

interface ModelFollowButtonProps {
  model: Model;
}

export const ModelFollowButton: React.FC<ModelFollowButtonProps> = ({ model }) => {
  const followMutation = useFollowModel(model.slug);

  const handleFollow = () => {
    followMutation.mutate();
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleFollow}
        disabled={followMutation.isPending}
        variant={model.isFollowing ? 'outline' : 'default'}
        className="min-w-[120px]"
      >
        {followMutation.isPending ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {model.isFollowing ? 'Unfollowing...' : 'Following...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {model.isFollowing ? (
              <>
                <span>✓</span>
                <span>Following</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>Follow</span>
              </>
            )}
          </span>
        )}
      </Button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {model.followerCount.toLocaleString()} {model.followerCount === 1 ? 'follower' : 'followers'}
      </span>
    </div>
  );
};

export default ModelFollowButton;
