/**
 * PollVoting Component
 * Interactive voting interface for polls with radio/checkbox options
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button/Button';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { useVoteOnPoll } from '../hooks/usePolls';
import type { TopicPoll } from '../types';
import { PollResults } from './PollResults';

interface PollVotingProps {
  poll: TopicPoll;
  className?: string;
}

export const PollVoting: React.FC<PollVotingProps> = ({ poll, className }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const voteOnPollMutation = useVoteOnPoll();

  // Check if poll has ended
  const hasEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const canVote = !hasEnded && (!poll.userHasVoted || poll.allowMultiple);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    if (!poll.endsAt) return null;

    const now = new Date();
    const endDate = new Date(poll.endsAt);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, [poll.endsAt]);

  const handleOptionToggle = (optionId: string) => {
    if (!canVote) return;

    if (poll.allowMultiple) {
      // Multiple choice: toggle option
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single choice: replace selection
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !canVote) return;

    try {
      await voteOnPollMutation.mutateAsync({
        pollId: poll.id,
        optionIds: selectedOptions,
      });
      // Clear selection after successful vote
      setSelectedOptions([]);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  // Show results if user has voted or poll has ended
  const showResults = poll.userHasVoted || hasEnded;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Poll Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {poll.question}
        </h3>

        {/* Poll Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
          </span>

          {poll.endsAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {getTimeRemaining()}
            </span>
          )}

          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            poll.allowMultiple
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
          )}>
            {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}
          </span>

          {poll.isAnonymous && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              Anonymous
            </span>
          )}

          {poll.userHasVoted && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              You voted
            </span>
          )}
        </div>
      </div>

      {/* Voting Interface or Results */}
      {showResults ? (
        <PollResults poll={poll} />
      ) : (
        <div className="space-y-3">
          {/* Options */}
          <div className="space-y-2">
            {poll.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={!canVote}
                  className={cn(
                    'group w-full rounded-lg border-2 p-4 text-left transition-all',
                    'hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800',
                    !canVote && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio/Checkbox Icon */}
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded transition-colors',
                        poll.allowMultiple ? 'rounded-md' : 'rounded-full',
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'border-2 border-gray-400 bg-white dark:border-gray-600 dark:bg-gray-900'
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    {/* Option Text */}
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Vote Button */}
          {canVote && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || voteOnPollMutation.isPending}
                size="sm"
              >
                {voteOnPollMutation.isPending ? 'Voting...' : 'Submit Vote'}
              </Button>
            </div>
          )}

          {/* Info Text */}
          {!canVote && hasEnded && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This poll has ended. Results are shown above.
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {voteOnPollMutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to submit vote. Please try again.
        </p>
      )}
    </div>
  );
};

export default PollVoting;
