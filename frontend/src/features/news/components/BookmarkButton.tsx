import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { useBookmarkArticle } from '../hooks/useArticleDetail';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface BookmarkButtonProps {
  articleId: string;
  isBookmarked: boolean;
  bookmarkCount: number;
  className?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  articleId,
  isBookmarked,
  bookmarkCount,
  className = '',
}) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const bookmarkMutation = useBookmarkArticle();

  const handleBookmark = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { returnTo: window.location.pathname } });
      return;
    }

    bookmarkMutation.mutate({ articleId, isBookmarked });
  };

  return (
    <Button
      variant={isBookmarked ? 'default' : 'outline'}
      size="sm"
      onClick={handleBookmark}
      disabled={bookmarkMutation.isPending}
      className={`flex items-center gap-2 ${className}`}
    >
      <Bookmark
        className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`}
      />
      <span>
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </span>
      {bookmarkCount > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
          {bookmarkCount}
        </span>
      )}
    </Button>
  );
};
