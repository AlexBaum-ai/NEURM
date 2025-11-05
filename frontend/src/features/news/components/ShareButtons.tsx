import React, { useState } from 'react';
import { Share2, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';

interface ShareButtonsProps {
  title: string;
  url: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin') => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <button
              onClick={() => handleShare('twitter')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Share on Twitter
              </span>
            </button>

            <button
              onClick={() => handleShare('linkedin')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
            >
              <Linkedin className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Share on LinkedIn
              </span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Link copied!
                  </span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Copy link
                  </span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
