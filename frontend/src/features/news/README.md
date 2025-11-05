# News Feature - Article Detail Page

This feature implements a comprehensive article detail page for the Neurmatic LLM news platform.

## Features Implemented

### Core Functionality
- ✅ Article detail page at `/news/:slug`
- ✅ Article title, author, published date, reading time
- ✅ Featured image display with lazy loading
- ✅ Article content with proper markdown rendering
- ✅ Category and tags display (clickable links)
- ✅ Bookmark button (authenticated users only)
- ✅ Share buttons (Twitter, LinkedIn, copy link)
- ✅ Related articles section
- ✅ Author info sidebar
- ✅ Table of contents for long articles (auto-generated from h2/h3 headings)
- ✅ Reading progress indicator (scroll bar at top)
- ✅ Syntax highlighting for code blocks
- ✅ Responsive images
- ✅ SEO meta tags (Open Graph, Twitter Card)

## Component Structure

```
src/features/news/
├── api/
│   └── newsApi.ts                    # API client for article operations
├── components/
│   ├── ArticleHeader.tsx            # Article header with metadata
│   ├── ArticleContent.tsx           # Markdown content renderer
│   ├── ArticleMeta.tsx              # Author sidebar info
│   ├── TableOfContents.tsx          # Interactive TOC
│   ├── ShareButtons.tsx             # Social sharing buttons
│   ├── BookmarkButton.tsx           # Bookmark functionality
│   ├── RelatedArticles.tsx          # Related articles grid
│   ├── ReadingProgress.tsx          # Scroll progress bar
│   └── index.ts                     # Component exports
├── hooks/
│   └── useArticleDetail.ts          # React Query hooks
├── pages/
│   └── ArticleDetailPage.tsx        # Main page component
├── types/
│   └── index.ts                     # TypeScript types
├── utils/
│   └── dateUtils.ts                 # Date formatting utilities
└── README.md                        # This file
```

## Usage

### Basic Route
```tsx
// Route is configured in src/routes/index.tsx
{
  path: 'news/:slug',
  element: (
    <Suspense fallback={<PageLoader />}>
      <ArticleDetailPage />
    </Suspense>
  ),
}
```

### API Integration

The article detail page fetches data from:
```
GET /api/v1/news/articles/:slug
```

Expected response format:
```json
{
  "success": true,
  "data": {
    "article": {
      "id": "uuid",
      "slug": "article-slug",
      "title": "Article Title",
      "summary": "Brief summary",
      "content": "# Markdown content...",
      "featuredImageUrl": "https://...",
      "status": "PUBLISHED",
      "difficulty": "INTERMEDIATE",
      "readingTimeMinutes": 8,
      "viewCount": 1523,
      "bookmarkCount": 42,
      "publishedAt": "2024-01-01T00:00:00Z",
      "author": {
        "id": "uuid",
        "username": "author",
        "profile": {
          "avatarUrl": "...",
          "displayName": "Author Name",
          "bio": "Author bio..."
        }
      },
      "category": {
        "slug": "machine-learning",
        "name": "Machine Learning"
      },
      "tags": [
        { "slug": "gpt-4", "name": "GPT-4" },
        { "slug": "prompt-engineering", "name": "Prompt Engineering" }
      ],
      "isBookmarked": false
    },
    "relatedArticles": [...]
  }
}
```

## Key Technologies

- **Markdown Rendering**: `react-markdown` with `remark-gfm` and `rehype-highlight`
- **Syntax Highlighting**: `rehype-highlight` with highlight.js themes
- **SEO**: `react-helmet-async` for meta tags
- **State Management**: React Query (TanStack Query) for data fetching
- **Routing**: React Router v6
- **Styling**: TailwindCSS with dark mode support

## Features in Detail

### Markdown Rendering
- Full GitHub Flavored Markdown (GFM) support
- Syntax highlighting for code blocks
- Custom styling for blockquotes, tables, images
- Responsive images with lazy loading
- External links open in new tab

### Table of Contents
- Auto-generated from h2 and h3 headings
- Smooth scroll to sections
- Active section highlighting based on scroll position
- Sticky sidebar positioning

### Reading Progress
- Visual progress bar at the top of the page
- Calculates scroll percentage
- Gradient color (blue to purple)
- Fixed positioning

### Bookmarking
- Optimistic updates for instant feedback
- Requires authentication (redirects to login if not authenticated)
- Shows bookmark count
- Visual feedback (filled icon when bookmarked)

### Social Sharing
- Twitter intent link
- LinkedIn sharing
- Copy link to clipboard with confirmation
- Dropdown menu UI

### SEO Optimization
- Dynamic page title
- Meta description (first 160 chars of summary)
- Open Graph tags for social media previews
- Twitter Card tags
- Article-specific metadata (author, publish date, tags)
- Canonical URL

### Responsive Design
- Mobile-first approach
- 3-column layout on desktop (content + sidebar + TOC)
- 1-column layout on mobile
- Responsive images
- Touch-friendly buttons

### Performance Optimizations
- Lazy loading images
- Suspense boundaries for code splitting
- React Query caching (5-minute stale time)
- Optimistic updates for bookmarks
- View count delayed by 3 seconds (ensures user is reading)

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Proper heading hierarchy
- Alt text for images
- Color contrast compliance
- Focus indicators

## Testing

To test the article detail page:

1. **With mock data**: Create a mock article in your backend or use a test endpoint
2. **URL format**: `http://localhost:5173/news/your-article-slug`
3. **Features to test**:
   - Article rendering
   - Image lazy loading
   - Bookmark functionality (requires auth)
   - Share buttons
   - Table of contents navigation
   - Responsive layout
   - Dark mode

## Future Enhancements

Potential improvements for future sprints:

- [ ] Article reactions (like, love, insightful)
- [ ] Comment section
- [ ] Print-friendly view
- [ ] Article series navigation
- [ ] Text-to-speech
- [ ] Reading list
- [ ] Article versioning/edit history
- [ ] Multi-language support
- [ ] Estimated reading progress (not just scroll)
- [ ] Sticky share sidebar on desktop

## Dependencies

New dependencies added:
```json
{
  "react-markdown": "^9.0.1",
  "remark-gfm": "^4.0.0",
  "rehype-highlight": "^7.0.0",
  "rehype-raw": "^7.0.0",
  "react-helmet-async": "^2.0.5"
}
```

## Notes

- The article detail page uses Suspense boundaries, so all data fetching uses `useSuspenseQuery`
- View count is incremented after 3 seconds to ensure user engagement
- Bookmark functionality requires authentication and shows optimistic updates
- All timestamps use relative formatting ("5 minutes ago")
- Code blocks use the GitHub Dark theme for syntax highlighting
- The reading progress bar is fixed at the top and doesn't interfere with the header
