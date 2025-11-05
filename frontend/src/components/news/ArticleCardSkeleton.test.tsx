import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticleCardSkeleton from './ArticleCardSkeleton';

describe('ArticleCardSkeleton', () => {
  describe('Rendering', () => {
    it('renders single skeleton by default', () => {
      const { container } = render(<ArticleCardSkeleton />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(1);
    });

    it('renders multiple skeletons when count is specified', () => {
      const { container } = render(<ArticleCardSkeleton count={5} />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(5);
    });

    it('has accessible loading label', () => {
      render(<ArticleCardSkeleton />);
      expect(screen.getByText('Loading articles...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading article')).toBeInTheDocument();
    });
  });

  describe('Grid Variant', () => {
    it('renders grid variant by default', () => {
      const { container } = render(<ArticleCardSkeleton />);

      // Check for image skeleton
      const imageSkeleton = container.querySelector('.h-48.bg-gray-200');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('has correct structure for grid layout', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);

      // Check for main container
      expect(container.querySelector('.rounded-lg.border')).toBeInTheDocument();

      // Check for image skeleton
      expect(container.querySelector('.h-48')).toBeInTheDocument();

      // Check for content section
      expect(container.querySelector('.p-4')).toBeInTheDocument();
    });

    it('has animate-pulse class', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('List Variant', () => {
    it('renders list variant correctly', () => {
      const { container } = render(<ArticleCardSkeleton variant="list" />);

      // Check for horizontal layout (flex)
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toHaveClass('flex', 'gap-4');

      // Check for smaller image (32 units height)
      expect(container.querySelector('.h-32.w-32')).toBeInTheDocument();
    });

    it('has correct structure for list layout', () => {
      const { container } = render(<ArticleCardSkeleton variant="list" />);

      // Check for image skeleton
      expect(container.querySelector('.h-32.w-32.bg-gray-200')).toBeInTheDocument();

      // Check for content section
      expect(container.querySelector('.flex-1.min-w-0')).toBeInTheDocument();
    });
  });

  describe('Featured Variant', () => {
    it('renders featured variant correctly', () => {
      const { container } = render(<ArticleCardSkeleton variant="featured" />);

      // Check for larger image height
      expect(container.querySelector('.h-80')).toBeInTheDocument();

      // Check for gradient overlay
      expect(container.querySelector('.bg-gradient-to-t')).toBeInTheDocument();
    });

    it('has correct structure for featured layout', () => {
      const { container } = render(<ArticleCardSkeleton variant="featured" />);

      // Check for rounded-xl (larger radius)
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();

      // Check for shadow-lg (larger shadow)
      expect(container.querySelector('.shadow-lg')).toBeInTheDocument();
    });

    it('has accessible label for featured article', () => {
      render(<ArticleCardSkeleton variant="featured" />);
      expect(screen.getByLabelText('Loading featured article')).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders compact variant correctly', () => {
      const { container } = render(<ArticleCardSkeleton variant="compact" />);

      // Check for smaller image (20 units)
      expect(container.querySelector('.h-20.w-20')).toBeInTheDocument();
    });

    it('has correct structure for compact layout', () => {
      const { container } = render(<ArticleCardSkeleton variant="compact" />);

      // Check for horizontal layout
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toHaveClass('flex', 'gap-3');

      // Check for smaller padding
      expect(skeleton).toHaveClass('p-3');
    });
  });

  describe('Animation', () => {
    it('has pulse animation on all variants', () => {
      const variants = ['grid', 'list', 'featured', 'compact'] as const;

      variants.forEach((variant) => {
        const { container } = render(<ArticleCardSkeleton variant={variant} />);
        const skeleton = container.querySelector('[role="status"]');
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes for grid variant', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);

      // Check for dark mode border
      expect(container.querySelector('.dark\\:border-gray-800')).toBeInTheDocument();

      // Check for dark mode background
      expect(container.querySelector('.dark\\:bg-gray-950')).toBeInTheDocument();
    });

    it('has dark mode classes for skeleton elements', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);

      // Check for dark mode gray backgrounds on skeleton elements
      const darkElements = container.querySelectorAll('.dark\\:bg-gray-800');
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Skeletons', () => {
    it('renders correct number of skeletons', () => {
      const counts = [1, 3, 5, 10];

      counts.forEach((count) => {
        const { container } = render(<ArticleCardSkeleton count={count} />);
        const skeletons = container.querySelectorAll('[role="status"]');
        expect(skeletons).toHaveLength(count);
      });
    });

    it('each skeleton has unique key', () => {
      const { container } = render(<ArticleCardSkeleton count={5} />);
      const skeletons = container.querySelectorAll('[role="status"]');

      // Check that all skeletons are rendered (no key conflicts)
      expect(skeletons).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<ArticleCardSkeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label describing loading state', () => {
      render(<ArticleCardSkeleton />);
      expect(screen.getByLabelText('Loading article')).toBeInTheDocument();
    });

    it('has sr-only text for screen readers', () => {
      const { container } = render(<ArticleCardSkeleton />);
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Loading articles...');
    });

    it('maintains accessibility with multiple skeletons', () => {
      render(<ArticleCardSkeleton count={3} />);
      const loadingElements = screen.getAllByLabelText('Loading article');
      expect(loadingElements).toHaveLength(3);
    });
  });

  describe('Layout Consistency', () => {
    it('grid skeleton matches ArticleCard grid dimensions', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);

      // Image should be h-48
      expect(container.querySelector('.h-48')).toBeInTheDocument();

      // Should have padding p-4
      expect(container.querySelector('.p-4')).toBeInTheDocument();

      // Should have rounded-lg
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('list skeleton matches ArticleCard list dimensions', () => {
      const { container } = render(<ArticleCardSkeleton variant="list" />);

      // Image should be h-32 w-32
      expect(container.querySelector('.h-32.w-32')).toBeInTheDocument();

      // Should have gap-4
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toHaveClass('gap-4');
    });

    it('featured skeleton matches ArticleCard featured dimensions', () => {
      const { container } = render(<ArticleCardSkeleton variant="featured" />);

      // Image should be h-80 sm:h-96
      expect(container.querySelector('.h-80')).toBeInTheDocument();

      // Should have rounded-xl
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('compact skeleton matches ArticleCard compact dimensions', () => {
      const { container } = render(<ArticleCardSkeleton variant="compact" />);

      // Image should be h-20 w-20
      expect(container.querySelector('.h-20.w-20')).toBeInTheDocument();

      // Should have gap-3
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toHaveClass('gap-3');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive classes for featured variant', () => {
      const { container } = render(<ArticleCardSkeleton variant="featured" />);

      // Should have sm:h-96 for larger screens
      const imageContainer = container.querySelector('.h-80');
      expect(imageContainer).toHaveClass('sm:h-96');
    });
  });

  describe('Edge Cases', () => {
    it('handles count of 0', () => {
      const { container } = render(<ArticleCardSkeleton count={0} />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(0);
    });

    it('handles large count values', () => {
      const { container } = render(<ArticleCardSkeleton count={50} />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons).toHaveLength(50);
    });

    it('handles undefined variant (uses default)', () => {
      const { container } = render(<ArticleCardSkeleton variant={undefined} />);

      // Should default to grid variant
      expect(container.querySelector('.h-48')).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('uses consistent border colors across variants', () => {
      const variants = ['grid', 'list', 'featured'] as const;

      variants.forEach((variant) => {
        const { container } = render(<ArticleCardSkeleton variant={variant} />);
        expect(container.querySelector('.border-gray-200')).toBeInTheDocument();
      });
    });

    it('uses consistent background colors for skeleton elements', () => {
      const { container } = render(<ArticleCardSkeleton variant="grid" />);

      // All skeleton elements should use bg-gray-200
      const grayBgElements = container.querySelectorAll('.bg-gray-200');
      expect(grayBgElements.length).toBeGreaterThan(0);
    });
  });
});
