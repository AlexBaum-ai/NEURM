import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ArticleCard from './ArticleCard';
import type { Article } from '@/features/news/types';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Test article data
const mockArticle: Article = {
  id: '1',
  slug: 'test-article',
  title: 'Test Article Title',
  summary: 'This is a test article summary that describes the content.',
  content: 'Full article content',
  featuredImageUrl: 'https://example.com/image.jpg',
  status: 'PUBLISHED',
  difficulty: 'INTERMEDIATE',
  readingTimeMinutes: 5,
  viewCount: 100,
  bookmarkCount: 10,
  publishedAt: new Date('2024-01-01').toISOString(),
  author: {
    id: 'author-1',
    username: 'testuser',
    profile: {
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      displayName: 'Test User',
    },
  },
  category: {
    slug: 'tutorials',
    name: 'Tutorials',
    description: 'Tutorial articles',
  },
  tags: [
    { slug: 'tag1', name: 'Tag1', description: 'First tag' },
    { slug: 'tag2', name: 'Tag2', description: 'Second tag' },
    { slug: 'tag3', name: 'Tag3', description: 'Third tag' },
  ],
  isBookmarked: false,
};

// Wrapper component with Router
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', username: 'testuser' },
      isAuthenticated: true,
    });
  });

  describe('Grid Variant (Default)', () => {
    it('renders article information correctly', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test article summary that describes the content.')
      ).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Tutorials')).toBeInTheDocument();
    });

    it('renders tags with maximum of 3', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByText('#Tag1')).toBeInTheDocument();
      expect(screen.getByText('#Tag2')).toBeInTheDocument();
      expect(screen.getByText('#Tag3')).toBeInTheDocument();
    });

    it('shows +N indicator when more than 3 tags', () => {
      const articleWithManyTags = {
        ...mockArticle,
        tags: [
          ...mockArticle.tags,
          { slug: 'tag4', name: 'Tag4', description: 'Fourth tag' },
          { slug: 'tag5', name: 'Tag5', description: 'Fifth tag' },
        ],
      };

      render(<ArticleCard article={articleWithManyTags} />, { wrapper: Wrapper });

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('renders featured image with correct attributes', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const image = screen.getByAltText('Test Article Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders fallback when no featured image', () => {
      const articleWithoutImage = { ...mockArticle, featuredImageUrl: undefined };
      render(<ArticleCard article={articleWithoutImage} />, { wrapper: Wrapper });

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter fallback
    });

    it('displays reading time, view count, and bookmark count', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('displays difficulty badge with correct styling', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const difficultyBadge = screen.getByText('INTERMEDIATE');
      expect(difficultyBadge).toBeInTheDocument();
      expect(difficultyBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('links to article detail page', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const links = screen.getAllByRole('link');
      const articleLink = links.find((link) =>
        link.getAttribute('href')?.includes('/news/test-article')
      );
      expect(articleLink).toBeInTheDocument();
    });
  });

  describe('List Variant', () => {
    it('renders in list layout', () => {
      const { container } = render(<ArticleCard article={mockArticle} variant="list" />, {
        wrapper: Wrapper,
      });

      expect(container.querySelector('.flex.gap-4')).toBeInTheDocument();
    });

    it('displays all essential information', () => {
      render(<ArticleCard article={mockArticle} variant="list" />, { wrapper: Wrapper });

      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Tutorials')).toBeInTheDocument();
    });
  });

  describe('Featured Variant', () => {
    it('renders in featured layout with overlay', () => {
      const { container } = render(<ArticleCard article={mockArticle} variant="featured" />, {
        wrapper: Wrapper,
      });

      expect(container.querySelector('.absolute.inset-0.bg-gradient-to-t')).toBeInTheDocument();
    });

    it('uses larger text for title', () => {
      render(<ArticleCard article={mockArticle} variant="featured" />, { wrapper: Wrapper });

      const title = screen.getByText('Test Article Title');
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });
  });

  describe('Compact Variant', () => {
    it('renders in compact layout', () => {
      render(<ArticleCard article={mockArticle} variant="compact" />, { wrapper: Wrapper });

      const title = screen.getByText('Test Article Title');
      expect(title).toHaveClass('text-sm');
    });

    it('shows maximum 2 tags', () => {
      render(<ArticleCard article={mockArticle} variant="compact" />, { wrapper: Wrapper });

      expect(screen.getByText('#Tag1')).toBeInTheDocument();
      expect(screen.getByText('#Tag2')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument(); // +1 for the third tag
    });
  });

  describe('Bookmark Functionality', () => {
    it('renders bookmark button when authenticated', () => {
      render(<ArticleCard article={mockArticle} showBookmark={true} />, { wrapper: Wrapper });

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      expect(bookmarkButton).toBeInTheDocument();
    });

    it('does not render bookmark button when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      render(<ArticleCard article={mockArticle} showBookmark={true} />, { wrapper: Wrapper });

      expect(screen.queryByLabelText('Add bookmark')).not.toBeInTheDocument();
    });

    it('does not render bookmark button when showBookmark is false', () => {
      render(<ArticleCard article={mockArticle} showBookmark={false} />, { wrapper: Wrapper });

      expect(screen.queryByLabelText('Add bookmark')).not.toBeInTheDocument();
    });

    it('calls onBookmarkToggle when bookmark button is clicked', async () => {
      const onBookmarkToggle = vi.fn().mockResolvedValue(undefined);

      render(
        <ArticleCard article={mockArticle} showBookmark={true} onBookmarkToggle={onBookmarkToggle} />,
        { wrapper: Wrapper }
      );

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      fireEvent.click(bookmarkButton);

      await waitFor(() => {
        expect(onBookmarkToggle).toHaveBeenCalledWith('1', true);
      });
    });

    it('toggles bookmark state correctly', async () => {
      const onBookmarkToggle = vi.fn().mockResolvedValue(undefined);

      render(
        <ArticleCard article={mockArticle} showBookmark={true} onBookmarkToggle={onBookmarkToggle} />,
        { wrapper: Wrapper }
      );

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      fireEvent.click(bookmarkButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Remove bookmark'));

      await waitFor(() => {
        expect(onBookmarkToggle).toHaveBeenCalledWith('1', false);
      });
    });

    it('disables bookmark button while bookmarking', async () => {
      const onBookmarkToggle = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <ArticleCard article={mockArticle} showBookmark={true} onBookmarkToggle={onBookmarkToggle} />,
        { wrapper: Wrapper }
      );

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      fireEvent.click(bookmarkButton);

      expect(bookmarkButton).toBeDisabled();
    });

    it('shows bookmarked state when isBookmarked is true', () => {
      const bookmarkedArticle = { ...mockArticle, isBookmarked: true };

      render(<ArticleCard article={bookmarkedArticle} showBookmark={true} />, {
        wrapper: Wrapper,
      });

      expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = vi.fn();

      render(<ArticleCard article={mockArticle} onClick={onClick} />, { wrapper: Wrapper });

      const article = screen.getByRole('article');
      fireEvent.click(article);

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for metrics', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByLabelText('Reading time: 5 minutes')).toBeInTheDocument();
      expect(screen.getByLabelText('View count: 100')).toBeInTheDocument();
      expect(screen.getByLabelText('Bookmark count: 10')).toBeInTheDocument();
    });

    it('has proper ARIA labels for bookmark button', () => {
      render(<ArticleCard article={mockArticle} showBookmark={true} />, { wrapper: Wrapper });

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      expect(bookmarkButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('has proper time element with dateTime attribute', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const timeElement = screen.getByText(/ago/);
      expect(timeElement.tagName).toBe('TIME');
      expect(timeElement).toHaveAttribute('dateTime');
    });

    it('has proper semantic HTML structure', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('has focus visible styles on interactive elements', () => {
      render(<ArticleCard article={mockArticle} showBookmark={true} />, { wrapper: Wrapper });

      const bookmarkButton = screen.getByLabelText('Add bookmark');
      expect(bookmarkButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Date Formatting', () => {
    it('displays "hours ago" for recent articles', () => {
      const recentArticle = {
        ...mockArticle,
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      };

      render(<ArticleCard article={recentArticle} />, { wrapper: Wrapper });

      expect(screen.getByText('5h ago')).toBeInTheDocument();
    });

    it('displays "days ago" for articles from last week', () => {
      const lastWeekArticle = {
        ...mockArticle,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      };

      render(<ArticleCard article={lastWeekArticle} />, { wrapper: Wrapper });

      expect(screen.getByText('3d ago')).toBeInTheDocument();
    });

    it('displays full date for older articles', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      expect(screen.getByText(/Jan \d+, 2024/)).toBeInTheDocument();
    });
  });

  describe('Difficulty Badge Colors', () => {
    const difficultyTests = [
      { difficulty: 'BEGINNER', colorClass: 'bg-green-100' },
      { difficulty: 'INTERMEDIATE', colorClass: 'bg-blue-100' },
      { difficulty: 'ADVANCED', colorClass: 'bg-orange-100' },
      { difficulty: 'EXPERT', colorClass: 'bg-red-100' },
    ];

    difficultyTests.forEach(({ difficulty, colorClass }) => {
      it(`renders ${difficulty} with correct color`, () => {
        const articleWithDifficulty = { ...mockArticle, difficulty };
        render(<ArticleCard article={articleWithDifficulty} />, { wrapper: Wrapper });

        const badge = screen.getByText(difficulty);
        expect(badge).toHaveClass(colorClass);
      });
    });
  });

  describe('Image Optimization', () => {
    it('has srcset attribute for responsive images', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const image = screen.getByAltText('Test Article Title') as HTMLImageElement;
      expect(image.srcset).toBeTruthy();
      expect(image.srcset).toContain('400w');
      expect(image.srcset).toContain('800w');
    });

    it('has sizes attribute for responsive images', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const image = screen.getByAltText('Test Article Title') as HTMLImageElement;
      expect(image.sizes).toBeTruthy();
    });

    it('uses lazy loading for images', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const image = screen.getByAltText('Test Article Title');
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Author Display', () => {
    it('displays author avatar when available', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const avatar = screen.getByAltText('testuser');
      expect(avatar).toBeInTheDocument();
    });

    it('displays fallback avatar when no image', () => {
      const articleWithoutAvatar = {
        ...mockArticle,
        author: {
          ...mockArticle.author,
          profile: { ...mockArticle.author.profile, avatarUrl: undefined },
        },
      };

      render(<ArticleCard article={articleWithoutAvatar} />, { wrapper: Wrapper });

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter
    });
  });

  describe('Category Link', () => {
    it('renders category as a link', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const categoryLink = screen.getByText('Tutorials').closest('a');
      expect(categoryLink).toHaveAttribute('href', '/news/categories/tutorials');
    });

    it('stops propagation on category click', () => {
      const onClick = vi.fn();
      render(<ArticleCard article={mockArticle} onClick={onClick} />, { wrapper: Wrapper });

      const categoryLink = screen.getByText('Tutorials');
      fireEvent.click(categoryLink);

      // onClick should not be called due to stopPropagation
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Tag Links', () => {
    it('renders tags as links', () => {
      render(<ArticleCard article={mockArticle} />, { wrapper: Wrapper });

      const tagLink = screen.getByText('#Tag1').closest('a');
      expect(tagLink).toHaveAttribute('href', '/news/tags/tag1');
    });

    it('stops propagation on tag click', () => {
      const onClick = vi.fn();
      render(<ArticleCard article={mockArticle} onClick={onClick} />, { wrapper: Wrapper });

      const tagLink = screen.getByText('#Tag1');
      fireEvent.click(tagLink);

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
