/**
 * VotingWidget Usage Examples
 * Demonstrates how to integrate the voting system into topics and replies
 */

import React from 'react';
import { VotingWidget } from './VotingWidget';
import type { ForumTopic, ForumReply } from '../types';

/**
 * Example 1: Using VotingWidget in a Topic Card
 */
export const TopicCardWithVoting: React.FC<{ topic: ForumTopic }> = ({ topic }) => {
  return (
    <div className="flex gap-4">
      {/* Voting Widget - Left Sidebar */}
      <VotingWidget
        voteableType="topic"
        voteableId={topic.id}
        initialScore={topic.voteScore}
        initialUserVote={topic.userVote}
        enableKeyboardShortcuts={true}
        onVoteSuccess={() => {
          console.log('Vote successful!');
        }}
        onVoteError={(error) => {
          console.error('Vote failed:', error);
        }}
      />

      {/* Topic Content */}
      <div className="flex-1">
        <h2>{topic.title}</h2>
        <p>{topic.excerpt}</p>
      </div>
    </div>
  );
};

/**
 * Example 2: Using VotingWidget in a Reply Card
 */
export const ReplyCardWithVoting: React.FC<{ reply: ForumReply }> = ({ reply }) => {
  return (
    <div className="flex gap-4 ml-8">
      {/* Voting Widget */}
      <VotingWidget
        voteableType="reply"
        voteableId={reply.id}
        initialScore={reply.voteScore}
        initialUserVote={reply.userVote}
        enableKeyboardShortcuts={false} // Disable to prevent conflicts with multiple replies
        className="flex-shrink-0"
      />

      {/* Reply Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold">{reply.author.username}</span>
          <span className="text-sm text-gray-500">{reply.createdAt}</span>
        </div>
        <div dangerouslySetInnerHTML={{ __html: reply.content }} />
      </div>
    </div>
  );
};

/**
 * Example 3: Topic Detail Page with Voting
 */
export const TopicDetailWithVoting: React.FC<{ topic: ForumTopic }> = ({ topic }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6">
        {/* Left Sidebar with Voting */}
        <aside className="w-16 flex-shrink-0">
          <div className="sticky top-20">
            <VotingWidget
              voteableType="topic"
              voteableId={topic.id}
              initialScore={topic.voteScore}
              initialUserVote={topic.userVote}
              enableKeyboardShortcuts={true}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{topic.title}</h1>
          <div className="prose prose-lg">
            {topic.content}
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * Example 4: Using with React Query for automatic updates
 */
export const TopicWithQueryIntegration: React.FC<{ topicId: string }> = ({ topicId }) => {
  const { data: topic } = useTopic(topicId); // Assuming this hook exists

  if (!topic) return null;

  return (
    <div className="flex gap-4">
      <VotingWidget
        voteableType="topic"
        voteableId={topic.id}
        initialScore={topic.voteScore}
        initialUserVote={topic.userVote}
        onVoteSuccess={() => {
          // The hook automatically handles cache updates via optimistic updates
          console.log('Vote synced with server');
        }}
        onVoteError={(error) => {
          // Show error toast or notification
          console.error('Failed to vote:', error.message);
        }}
      />
      <div className="flex-1">
        {/* Topic content */}
      </div>
    </div>
  );
};

/**
 * Example 5: Keyboard Shortcuts Usage
 *
 * When enableKeyboardShortcuts is true:
 * - Press 'U' to upvote
 * - Press 'D' to downvote
 *
 * Note: Shortcuts are automatically disabled when focus is on input fields
 */

/**
 * Example 6: Handling Insufficient Reputation
 */
export const VotingWithReputationCheck: React.FC<{ topic: ForumTopic }> = ({ topic }) => {
  const handleVoteError = (error: Error) => {
    if (error.message.includes('reputation')) {
      // Show specific error for reputation requirement
      alert('You need reputation 50+ to downvote. Keep contributing to earn reputation!');
    } else {
      alert('Failed to vote. Please try again.');
    }
  };

  return (
    <VotingWidget
      voteableType="topic"
      voteableId={topic.id}
      initialScore={topic.voteScore}
      initialUserVote={topic.userVote}
      onVoteError={handleVoteError}
    />
  );
};

/**
 * Key Features Demonstrated:
 *
 * 1. Optimistic Updates: UI updates immediately, rolls back on error
 * 2. Keyboard Shortcuts: U for upvote, D for downvote
 * 3. Animations: Smooth score transitions using Framer Motion
 * 4. Accessibility: ARIA labels, keyboard navigation, screen reader support
 * 5. Reputation Checks: Automatic enforcement of downvote requirements
 * 6. Error Handling: Graceful rollback and error notifications
 * 7. Vote Formatting: Large numbers formatted as 1.2k, 5.5k, etc.
 * 8. State Management: Integrates with Zustand store and React Query
 */
