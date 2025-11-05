import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface TopicPreviewProps {
  title: string;
  content: string;
  type: string;
  category: string;
  tags: string[];
  images: Array<{ preview: string }>;
  poll?: {
    question: string;
    options: Array<{ text: string }>;
    multipleChoice: boolean;
  } | null;
}

export const TopicPreview: React.FC<TopicPreviewProps> = ({
  title,
  content,
  type,
  category,
  tags,
  images,
  poll,
}) => {
  return (
    <div className="w-full">
      <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {type || 'discussion'}
            </span>
            {category && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                in {category}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title || 'Untitled Topic'}
          </h1>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">No content yet...</p>
          )}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700"
              >
                <img
                  src={img.preview}
                  alt={`Attachment ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Poll */}
        {poll && poll.question && (
          <div className="mt-6 rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              {poll.question}
            </h3>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-md border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {option.text || `Option ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              {poll.multipleChoice ? 'Multiple choices allowed' : 'Single choice only'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicPreview;
