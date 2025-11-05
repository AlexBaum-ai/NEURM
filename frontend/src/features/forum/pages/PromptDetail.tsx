import React, { Suspense, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  GitFork,
  ThumbsUp,
  ThumbsDown,
  Eye,
  User,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card } from '@/components/common/Card/Card';
import StarRating from '../components/StarRating';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  usePrompt,
  useCopyPrompt,
  useForkPrompt,
  useRatePrompt,
  useVotePrompt,
  useDeletePrompt,
  usePromptComments,
  useAddPromptComment,
} from '../hooks/usePrompts';
import { useAuth } from '~/features/auth/hooks/useAuth';
import { PROMPT_CATEGORIES, PROMPT_USE_CASES } from '../types/prompt';
import ReplyComposer from '../components/ReplyComposer';
import ReplyTree from '../components/ReplyTree';
import { formatRelativeTime } from '@/lib/utils';

const PromptDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!id) {
    throw new Error('Prompt ID is required');
  }

  const { data: promptData } = usePrompt(id);
  const { data: commentsData } = usePromptComments(id);
  const copyPrompt = useCopyPrompt();
  const forkPrompt = useForkPrompt();
  const ratePrompt = useRatePrompt(id);
  const votePrompt = useVotePrompt(id);
  const deletePrompt = useDeletePrompt();
  const addComment = useAddPromptComment(id);

  const [showRating, setShowRating] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const prompt = promptData.prompt;

  const getCategoryLabel = (value: string) => {
    return PROMPT_CATEGORIES.find((cat) => cat.value === value)?.label || value;
  };

  const getUseCaseLabel = (value: string) => {
    return PROMPT_USE_CASES.find((uc) => uc.value === value)?.label || value;
  };

  const isAuthor = user?.id === prompt.userId;

  const handleCopy = () => {
    copyPrompt(prompt.content);
  };

  const handleFork = async () => {
    const result = await forkPrompt.mutateAsync(id);
    if (result) {
      navigate(`/forum/prompts/${result.prompt.id}/edit`);
    }
  };

  const handleRate = (rating: number) => {
    ratePrompt.mutate({ rating });
    setShowRating(false);
  };

  const handleVote = (voteType: 'up' | 'down') => {
    // Toggle vote if clicking the same button
    if (prompt.userVote === voteType) {
      return; // Can add unvote functionality if needed
    }
    votePrompt.mutate({ voteType });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      await deletePrompt.mutateAsync(id);
      navigate('/forum/prompts');
    }
  };

  const handleCommentSubmit = async (content: string) => {
    await addComment.mutateAsync({ content });
    setShowCommentForm(false);
  };

  return (
    <div className="container-custom py-8">
      {/* Back Button */}
      <Link
        to="/forum/prompts"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {prompt.title}
              </h1>
              {isAuthor && (
                <div className="flex gap-2">
                  <Link to={`/forum/prompts/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deletePrompt.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {getCategoryLabel(prompt.category)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getUseCaseLabel(prompt.useCase)}
              </span>
              {prompt.model && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {prompt.model}
                </span>
              )}
            </div>

            {/* Author & Date */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {prompt.author.avatar ? (
                  <img
                    src={prompt.author.avatar}
                    alt={prompt.author.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <Link
                  to={`/profile/${prompt.author.username}`}
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {prompt.author.displayName}
                </Link>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatRelativeTime(prompt.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {prompt.viewCount} views
              </div>
            </div>

            {/* Prompt Content */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <h3 className="text-lg font-semibold mb-3">Prompt</h3>
              <SyntaxHighlighter
                language="markdown"
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                }}
              >
                {prompt.content}
              </SyntaxHighlighter>
            </div>

            {/* Template Metadata */}
            {prompt.templateJson && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">Template Configuration</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(prompt.templateJson).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={handleFork}
                disabled={forkPrompt.isPending}
              >
                <GitFork className="w-4 h-4 mr-2" />
                Fork {prompt.forkCount > 0 && `(${prompt.forkCount})`}
              </Button>
              <Button variant="outline" onClick={() => setShowRating(!showRating)}>
                Rate this Prompt
              </Button>
            </div>

            {/* Rating Section */}
            {showRating && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Rate the effectiveness of this prompt:
                </p>
                <StarRating
                  value={prompt.userRating || 0}
                  onChange={handleRate}
                  size="lg"
                />
              </div>
            )}

            {/* Parent Prompt */}
            {prompt.parentPrompt && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Forked from:
                </p>
                <Link
                  to={`/forum/prompts/${prompt.parentPrompt.id}`}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {prompt.parentPrompt.title} by {prompt.parentPrompt.author.displayName}
                </Link>
              </div>
            )}
          </Card>

          {/* Comments Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Comments ({commentsData.data.totalCount})
              </h2>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentForm(!showCommentForm)}
                >
                  Add Comment
                </Button>
              )}
            </div>

            {showCommentForm && user && (
              <div className="mb-6">
                <ReplyComposer
                  onSubmit={handleCommentSubmit}
                  onCancel={() => setShowCommentForm(false)}
                  placeholder="Share your thoughts about this prompt..."
                  submitButtonText="Post Comment"
                />
              </div>
            )}

            {commentsData.data.replies.length > 0 ? (
              <ReplyTree replies={commentsData.data.replies} topicId={id} />
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rating</span>
                <div className="flex items-center gap-2">
                  <StarRating value={prompt.ratingAvg} readonly size="sm" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({prompt.ratingCount})
                  </span>
                </div>
              </div>

              {/* Votes */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Votes</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote('up')}
                    disabled={!user}
                    className={
                      prompt.userVote === 'up' ? 'bg-green-50 dark:bg-green-900' : ''
                    }
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">{prompt.voteScore}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote('down')}
                    disabled={!user}
                    className={
                      prompt.userVote === 'down' ? 'bg-red-50 dark:bg-red-900' : ''
                    }
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Forks */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Forks</span>
                <span className="font-medium">{prompt.forkCount}</span>
              </div>

              {/* Views */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Views</span>
                <span className="font-medium">{prompt.viewCount}</span>
              </div>
            </div>
          </Card>

          {/* About Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Category</dt>
                <dd className="font-medium">{getCategoryLabel(prompt.category)}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Use Case</dt>
                <dd className="font-medium">{getUseCaseLabel(prompt.useCase)}</dd>
              </div>
              {prompt.model && (
                <div>
                  <dt className="text-gray-600 dark:text-gray-400 mb-1">Model</dt>
                  <dd className="font-medium">{prompt.model}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Created</dt>
                <dd className="font-medium">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400 mb-1">Updated</dt>
                <dd className="font-medium">
                  {new Date(prompt.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PromptDetail: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      }
    >
      <PromptDetailContent />
    </Suspense>
  );
};

export default PromptDetail;
