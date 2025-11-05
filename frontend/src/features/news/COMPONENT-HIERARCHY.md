# Article Detail Page - Component Hierarchy

## Visual Component Tree

```
ArticleDetailPage (pages/ArticleDetailPage.tsx)
├── Helmet (SEO meta tags)
│   ├── title
│   ├── meta description
│   ├── Open Graph tags
│   └── Twitter Card tags
│
├── ReadingProgress (fixed top bar)
│
└── Layout Grid (12 columns)
    │
    ├── Main Content (8 columns)
    │   ├── ArticleHeader
    │   │   ├── Category Badge (Link)
    │   │   ├── Title (h1)
    │   │   ├── Summary
    │   │   ├── Metadata Row
    │   │   │   ├── Author (Link + Avatar)
    │   │   │   ├── Published Date
    │   │   │   ├── Reading Time
    │   │   │   ├── View Count
    │   │   │   └── Difficulty Badge
    │   │   ├── Featured Image
    │   │   └── Tags (Links)
    │   │
    │   ├── ArticleContent
    │   │   └── ReactMarkdown
    │   │       ├── h2 (with id for TOC)
    │   │       ├── h3 (with id for TOC)
    │   │       ├── Paragraphs
    │   │       ├── Images (lazy loaded)
    │   │       ├── Links (external = new tab)
    │   │       ├── Code Blocks (syntax highlighted)
    │   │       ├── Inline Code
    │   │       ├── Blockquotes
    │   │       └── Tables
    │   │
    │   └── RelatedArticles
    │       └── Article Card Grid (1/2/3 columns)
    │           ├── Featured Image
    │           ├── Category Badge
    │           ├── Title (Link)
    │           ├── Summary
    │           ├── Author + Avatar
    │           ├── Reading Time
    │           └── Published Date
    │
    └── Sidebar (4 columns)
        ├── ArticleMeta
        │   ├── Actions Section (sticky)
        │   │   ├── BookmarkButton
        │   │   │   ├── Icon (filled if bookmarked)
        │   │   │   ├── Text
        │   │   │   └── Count Badge
        │   │   │
        │   │   └── ShareButtons
        │   │       ├── Share Button (trigger)
        │   │       └── Dropdown Menu
        │   │           ├── Twitter Share
        │   │           ├── LinkedIn Share
        │   │           └── Copy Link
        │   │
        │   ├── Author Info Card
        │   │   ├── Author Avatar (Link)
        │   │   ├── Display Name (Link)
        │   │   ├── Username
        │   │   ├── Bio
        │   │   └── View Profile Button
        │   │
        │   └── Article Info Card
        │       └── Published Date
        │
        └── TableOfContents (sticky)
            ├── Heading Icon
            ├── Title
            └── TOC Items List
                ├── h2 Items (level 0 indent)
                └── h3 Items (level 1 indent)
```

## Component Responsibilities

### Page Level
- **ArticleDetailPage**: Route handler, data fetching, layout orchestration

### Layout Components
- **ArticleHeader**: Top section with title, author, metadata
- **ArticleContent**: Markdown content renderer
- **ArticleMeta**: Sidebar with actions and author info
- **RelatedArticles**: Bottom section with related content

### Utility Components
- **ReadingProgress**: Fixed progress bar
- **TableOfContents**: Navigation sidebar
- **ShareButtons**: Social sharing dropdown
- **BookmarkButton**: Bookmark toggle with auth

## Data Flow

```
URL (/news/:slug)
    ↓
ArticleDetailPage
    ↓
useArticleDetail(slug) → React Query
    ↓
API: GET /api/v1/news/articles/:slug
    ↓
ArticleDetailResponse
    ↓
Props flow to child components
    ↓
User Interactions:
    ├── Bookmark → useBookmarkArticle() → Optimistic Update
    ├── Share → Open social intent/Copy to clipboard
    ├── TOC Click → Smooth scroll to heading
    └── View Count → Delayed API call (3s)
```

## State Management

### Server State (React Query)
- Article data (cached 5 minutes)
- Bookmark mutation (optimistic updates)
- Related articles (cached with article data)

### Local State
- TOC items (generated from content)
- Active TOC item (IntersectionObserver)
- Share menu open/closed
- Copy link confirmation
- Reading progress percentage

### Global State
- Auth state (Zustand - useAuthStore)
- User authentication status
- Current user info

## Styling Pattern

All components use:
- **TailwindCSS** utility classes
- **Dark mode** with `dark:` variants
- **Responsive** breakpoints (sm, md, lg)
- **Transitions** for interactive elements
- **Gradients** for visual interest
- **Shadows** for depth

## Interaction Patterns

### Hover States
- Links change color
- Buttons have background transitions
- Images scale slightly
- Cards lift with shadow

### Loading States
- Suspense boundary with skeleton
- Optimistic bookmark updates
- Disabled states during mutations

### Error States
- Error boundaries at page level
- Toast notifications for failures
- Rollback on mutation errors

## Responsive Breakpoints

```
Mobile (< 640px)
└── Single column
    ├── Full-width header
    ├── Full-width content
    ├── Full-width related articles (1 col)
    └── Sidebar below content

Tablet (640px - 1024px)
└── Adjusted columns
    ├── Full-width header
    ├── Full-width content
    ├── Related articles (2 cols)
    └── Sidebar below content

Desktop (> 1024px)
└── Grid layout (12 cols)
    ├── Content (8 cols)
    │   └── Related articles (3 cols)
    └── Sidebar (4 cols, sticky)
        ├── Actions (sticky)
        └── TOC (sticky)
```

## Accessibility Tree

```
<article> (main content)
├── <header>
│   ├── <nav> (category)
│   ├── <h1> (title)
│   ├── <p> (summary)
│   └── <ul> (tags)
├── <article> (prose content)
│   └── [markdown rendered content]
└── <section> (related)
    └── <nav> (related articles)

<aside> (sidebar)
├── <nav> (actions)
│   ├── <button> (bookmark)
│   └── <button> (share)
├── <section> (author)
│   └── <a> (profile link)
└── <nav> (TOC)
    └── <ul> (TOC items)
```

## Performance Considerations

### Code Splitting
- Page lazy loaded via React Router
- Suspense boundary for loading state

### Image Optimization
- Lazy loading attribute
- Responsive sizing
- Progressive loading

### Bundle Size
- react-markdown (~50KB)
- highlight.js theme (~5KB)
- Component code (~30KB)
**Total**: ~85KB (gzipped: ~25KB)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox
- IntersectionObserver API
- Clipboard API
- Smooth scroll behavior
