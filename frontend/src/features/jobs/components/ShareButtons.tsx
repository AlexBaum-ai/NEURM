import React, { useState } from 'react';
import { Share2, Check, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleLinkedInShare = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Share:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLinkedInShare}
          title="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          title="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          title="Copy link"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
