/**
 * VotingWidget Component
 * Complete voting UI with upvote/downvote buttons and score display
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteButton } from './VoteButton';
import { useVote } from '../hooks/useVote';
import { formatVoteCount, getVoteScoreColor } from '../utils/voteUtils';
import { cn } from '@/lib/utils';
import type { VoteableType } from '../types';

interface VotingWidgetProps {
  voteableType: VoteableType;
  voteableId: string;
  initialScore: number;
  initialUserVote?: number;
  enableKeyboardShortcuts?: boolean;
  className?: string;
  onVoteSuccess?: () => void;
  onVoteError?: (error: Error) => void;
}

/**
 * VotingWidget - Complete voting interface for topics and replies
 *
 * Features:
 * - Upvote/downvote buttons with visual feedback
 * - Animated score display
 * - Keyboard shortcuts (U for upvote, D for downvote)
 * - Optimistic updates with error rollback
 * - Tooltips for vote requirements
 * - Full accessibility support
 */
export const VotingWidget: React.FC<VotingWidgetProps> = ({
  voteableType,
  voteableId,
  initialScore,
  initialUserVote = 0,
  enableKeyboardShortcuts = true,
  className,
  onVoteSuccess,
  onVoteError,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [currentScore, setCurrentScore] = React.useState(initialScore);
  const [userVote, setUserVote] = React.useState(initialUserVote);

  const {
    upvote,
    downvote,
    isVoting,
    canDownvote,
    currentVote,
    error,
  } = useVote({
    voteableType,
    voteableId,
    currentScore,
    onSuccess: onVoteSuccess,
    onError: onVoteError,
  });

  // Update local state when vote changes
  useEffect(() => {
    setUserVote(currentVote);
  }, [currentVote]);

  // Update score with animation
  useEffect(() => {
    if (initialScore !== currentScore) {
      setCurrentScore(initialScore);
    }
  }, [initialScore]);

  // Keyboard shortcuts handler
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        !enableKeyboardShortcuts ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Check if the widget is in focus or viewport
      if (!widgetRef.current) return;

      const key = event.key.toLowerCase();

      if (key === 'u') {
        event.preventDefault();
        upvote();
      } else if (key === 'd') {
        event.preventDefault();
        downvote();
      }
    },
    [enableKeyboardShortcuts, upvote, downvote]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    if (enableKeyboardShortcuts) {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress, enableKeyboardShortcuts]);

  // Show error notification (could be replaced with toast)
  useEffect(() => {
    if (error) {
      console.error('Vote error:', error);
    }
  }, [error]);

  const upvoteTooltip = userVote === 1
    ? 'Remove upvote (U)'
    : 'Upvote (U)';

  const downvoteTooltip = !canDownvote
    ? 'Requires reputation 50+ to downvote'
    : userVote === -1
    ? 'Remove downvote (D)'
    : 'Downvote (D)';

  return (
    <div
      ref={widgetRef}
      className={cn(
        'flex flex-col items-center gap-1',
        'select-none',
        className
      )}
      role="group"
      aria-label="Voting controls"
    >
      {/* Upvote Button */}
      <VoteButton
        type="upvote"
        isActive={userVote === 1}
        isDisabled={isVoting}
        onClick={upvote}
        ariaLabel={upvoteTooltip}
        tooltip={upvoteTooltip}
      />

      {/* Score Display with Animation */}
      <div
        className="relative min-w-[3rem] h-8 flex items-center justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScore}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'text-base font-semibold tabular-nums',
              getVoteScoreColor(currentScore)
            )}
          >
            {formatVoteCount(currentScore)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Downvote Button */}
      <VoteButton
        type="downvote"
        isActive={userVote === -1}
        isDisabled={isVoting || !canDownvote}
        onClick={downvote}
        ariaLabel={downvoteTooltip}
        tooltip={downvoteTooltip}
      />

      {/* Screen reader announcement for keyboard shortcuts */}
      <div className="sr-only" role="status">
        {enableKeyboardShortcuts && (
          <>
            Press U to upvote, D to downvote.
            {!canDownvote && ' Downvoting requires reputation 50 or higher.'}
          </>
        )}
      </div>
    </div>
  );
};

export default VotingWidget;
