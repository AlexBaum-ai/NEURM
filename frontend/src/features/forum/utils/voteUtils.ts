/**
 * Voting Utility Functions
 * Helpers for formatting vote counts and handling vote logic
 */

/**
 * Format vote count for display
 * Converts large numbers to abbreviated format (1.2k, 5.5k, etc.)
 *
 * @param count - The vote count to format
 * @returns Formatted string representation of the count
 *
 * @example
 * formatVoteCount(42)      // "42"
 * formatVoteCount(1234)    // "1.2k"
 * formatVoteCount(5678)    // "5.7k"
 * formatVoteCount(12345)   // "12.3k"
 * formatVoteCount(123456)  // "123k"
 */
export function formatVoteCount(count: number): string {
  const absCount = Math.abs(count);

  // Less than 1000: show exact number
  if (absCount < 1000) {
    return count.toString();
  }

  // 1000 to 999,999: show in k format
  if (absCount < 1000000) {
    const formatted = (count / 1000).toFixed(1);
    // Remove trailing .0
    return formatted.endsWith('.0')
      ? `${Math.floor(count / 1000)}k`
      : `${formatted}k`;
  }

  // 1M+: show in M format
  const formatted = (count / 1000000).toFixed(1);
  return formatted.endsWith('.0')
    ? `${Math.floor(count / 1000000)}M`
    : `${formatted}M`;
}

/**
 * Calculate the new vote based on current vote and user action
 *
 * @param currentVote - Current vote state (-1, 0, or 1)
 * @param clickedVote - Vote button clicked (1 for upvote, -1 for downvote)
 * @returns New vote state
 *
 * @example
 * calculateNewVote(0, 1)   // 1 (upvote when not voted)
 * calculateNewVote(1, 1)   // 0 (remove upvote)
 * calculateNewVote(1, -1)  // -1 (change from upvote to downvote)
 * calculateNewVote(-1, -1) // 0 (remove downvote)
 */
export function calculateNewVote(currentVote: number, clickedVote: number): number {
  // If clicking the same vote, remove it
  if (currentVote === clickedVote) {
    return 0;
  }

  // Otherwise, set to the clicked vote
  return clickedVote;
}

/**
 * Calculate the new score based on old vote and new vote
 *
 * @param currentScore - Current vote score
 * @param oldVote - Previous vote state (-1, 0, or 1)
 * @param newVote - New vote state (-1, 0, or 1)
 * @returns New vote score
 *
 * @example
 * calculateNewScore(10, 0, 1)    // 11 (add upvote)
 * calculateNewScore(10, 1, 0)    // 9 (remove upvote)
 * calculateNewScore(10, 1, -1)   // 8 (change upvote to downvote)
 * calculateNewScore(10, -1, 1)   // 12 (change downvote to upvote)
 */
export function calculateNewScore(
  currentScore: number,
  oldVote: number,
  newVote: number
): number {
  // Remove the old vote effect
  let newScore = currentScore - oldVote;

  // Add the new vote effect
  newScore += newVote;

  return newScore;
}

/**
 * Get the color class for the vote score
 *
 * @param score - The vote score
 * @returns Tailwind color class
 */
export function getVoteScoreColor(score: number): string {
  if (score > 0) return 'text-green-600 dark:text-green-400';
  if (score < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}
