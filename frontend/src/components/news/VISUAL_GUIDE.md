# ArticleCard Visual Guide

A visual reference for all ArticleCard variants and their use cases.

## Variant Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ArticleCard Variants                       │
├─────────────┬───────────────┬──────────────┬────────────────────┤
│    Grid     │     List      │   Featured   │      Compact       │
│  (Default)  │               │              │                    │
└─────────────┴───────────────┴──────────────┴────────────────────┘
```

## 1. Grid Variant (Default)

**Best for**: Homepage, category pages, article feeds

**Layout**: Vertical card layout
**Image**: 192px height (w-full)
**Content**: Full metadata display

```
┌─────────────────────────────────┐
│                                 │
│      Featured Image (h-48)      │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Article Title (2 lines max)   │
│                                 │
│   Summary text (3 lines max)    │
│   with description...           │
│                                 │
│   #tag1  #tag2  #tag3          │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ 👤 username  •  2h ago          │
│                                 │
│ 🕐 5 min  👁 100  🔖 10     🔖  │
│                                 │
└─────────────────────────────────┘
```

**Features**:
- Full-width image at top
- Category badge overlaid on image (top-left)
- Difficulty badge overlaid on image (top-right)
- Title (line-clamp-2)
- Summary (line-clamp-3)
- Up to 3 tags
- Author info with avatar
- Reading time, views, bookmarks
- Bookmark button (bottom-right)

**CSS Classes**:
```
Container: rounded-lg border shadow-sm
Image: h-48 w-full object-cover
Content: p-4 flex flex-col
```

**Grid Layout Example**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <ArticleCard variant="grid" />
  <ArticleCard variant="grid" />
  <ArticleCard variant="grid" />
</div>
```

---

## 2. List Variant

**Best for**: Search results, author article pages, filtered lists

**Layout**: Horizontal card layout
**Image**: 128px × 128px
**Content**: Compact horizontal layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌────────┐  Category  Difficulty             🔖   │
│  │        │                                          │
│  │ Image  │  Article Title (2 lines max)            │
│  │ 128px  │                                          │
│  │        │  Summary text (2 lines max)...          │
│  └────────┘                                          │
│            #tag1  #tag2                              │
│                                                      │
│            👤 username  •  2h ago    🕐 5min  👁 100 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Features**:
- Image on left (fixed size)
- Category and difficulty badges (top-right)
- Title (line-clamp-2)
- Summary (line-clamp-2)
- Up to 3 tags
- Author and metadata in footer
- Bookmark button (top-right)

**CSS Classes**:
```
Container: flex gap-4 p-4 rounded-lg border
Image: h-32 w-32 rounded-md
Content: flex-1 min-w-0
```

**List Layout Example**:
```tsx
<div className="space-y-4 max-w-4xl">
  <ArticleCard variant="list" />
  <ArticleCard variant="list" />
  <ArticleCard variant="list" />
</div>
```

---

## 3. Featured Variant

**Best for**: Hero sections, featured article spotlights

**Layout**: Large format with overlay
**Image**: 320-384px height (responsive)
**Content**: Overlaid on image with gradient

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│               Featured Image                        │
│               (h-80 sm:h-96)                        │
│                                                     │
│              ┌─────────────────┐                    │
│ ▓▓▓▓▓▓▓▓▓▓▓▓│  Gradient       │▓▓▓▓▓▓▓▓▓▓▓       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓│  Overlay        │▓▓▓▓▓▓▓▓▓▓▓       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓└─────────────────┘▓▓▓▓▓▓▓▓▓▓▓       │
│ ▓▓                                       ▓▓        │
│ ▓▓  Category  Difficulty                ▓▓   🔖   │
│ ▓▓                                       ▓▓        │
│ ▓▓  Large Article Title                 ▓▓        │
│ ▓▓  That Can Span Multiple Lines        ▓▓        │
│ ▓▓                                       ▓▓        │
│ ▓▓  Summary text (2 lines)...           ▓▓        │
│ ▓▓                                       ▓▓        │
│ ▓▓  👤 username                          ▓▓        │
│ ▓▓     2h ago         🕐 5min  👁 100    ▓▓        │
│ ▓▓                                       ▓▓        │
└─────────────────────────────────────────────────────┘
│  #tag1  #tag2  #tag3                              │
└─────────────────────────────────────────────────────┘
```

**Features**:
- Large hero image
- Dark gradient overlay (from-black/80 to transparent)
- White text on dark background
- Larger title (text-2xl sm:text-3xl)
- Category and difficulty badges
- Summary text
- Author with larger avatar (h-8)
- Metadata (reading time, views)
- Bookmark button (top-right)
- Tags below image

**CSS Classes**:
```
Container: rounded-xl border shadow-lg
Image: h-80 sm:h-96 w-full
Overlay: absolute inset-0 bg-gradient-to-t
Content: absolute bottom-0 p-6 text-white
```

---

## 4. Compact Variant

**Best for**: Sidebars, related articles, "You may also like"

**Layout**: Minimal horizontal layout
**Image**: 80px × 80px
**Content**: Essential info only

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────┐  Article Title           🔖 │
│  │ Img  │  (2 lines max)              │
│  │ 80px │                              │
│  └──────┘  username  •  2h ago         │
│                                        │
│            #tag1  #tag2                │
│                                        │
└────────────────────────────────────────┘
```

**Features**:
- Tiny image (80px square)
- Title only (line-clamp-2, text-sm)
- Author and date (text-xs)
- Max 2 tags (text-[10px])
- Bookmark button (if enabled)
- No summary, no metadata
- Minimal padding (p-3)

**CSS Classes**:
```
Container: flex gap-3 p-3 rounded-lg hover:bg-gray-50
Image: h-20 w-20 rounded
Content: flex-1 min-w-0
```

**Compact Layout Example**:
```tsx
<div className="space-y-3 max-w-sm">
  <h3>Related Articles</h3>
  <ArticleCard variant="compact" showBookmark={false} />
  <ArticleCard variant="compact" showBookmark={false} />
  <ArticleCard variant="compact" showBookmark={false} />
</div>
```

---

## Responsive Behavior

### Grid Variant
```
Mobile (< 768px):   1 column  (full width)
Tablet (≥ 768px):   2 columns (gap-6)
Desktop (≥ 1024px): 3 columns (gap-6)
```

### List Variant
```
Mobile:  Image stacks or stays left (32px smaller)
Tablet:  Full horizontal layout
Desktop: Full horizontal layout
```

### Featured Variant
```
Mobile:  h-80, text-xl, smaller padding
Desktop: h-96, text-3xl, larger padding
```

### Compact Variant
```
All sizes: Same layout (designed for sidebars)
```

---

## Color-Coded Difficulty Badges

```
┌──────────┬─────────────────┬──────────────────────────┐
│ Level    │ Light Mode      │ Dark Mode                │
├──────────┼─────────────────┼──────────────────────────┤
│ BEGINNER │ 🟢 Green-100    │ 🟢 Green-900/30          │
│          │    Green-800    │    Green-400             │
├──────────┼─────────────────┼──────────────────────────┤
│ INTER-   │ 🔵 Blue-100     │ 🔵 Blue-900/30           │
│ MEDIATE  │    Blue-800     │    Blue-400              │
├──────────┼─────────────────┼──────────────────────────┤
│ ADVANCED │ 🟠 Orange-100   │ 🟠 Orange-900/30         │
│          │    Orange-800   │    Orange-400            │
├──────────┼─────────────────┼──────────────────────────┤
│ EXPERT   │ 🔴 Red-100      │ 🔴 Red-900/30            │
│          │    Red-800      │    Red-400               │
└──────────┴─────────────────┴──────────────────────────┘
```

---

## Interactive States

### Hover State
```
Grid/List/Featured:
- Shadow increases (shadow-sm → shadow-lg)
- Image scales (scale-105)
- Title changes color (text-blue-600)

Compact:
- Background changes (hover:bg-gray-50)
- Title changes color (text-blue-600)
```

### Focus State
```
All interactive elements:
- outline-none
- ring-2 ring-blue-500 ring-offset-2
```

### Bookmark Button States
```
Default:     text-gray-400 (not bookmarked)
Bookmarked:  text-blue-600 (bookmarked)
Hover:       bg-gray-100
Disabled:    opacity-50 cursor-not-allowed
```

---

## Loading Skeleton States

### Grid Skeleton
```
┌─────────────────────────────────┐
│                                 │
│    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ 192px
│                                 │
├─────────────────────────────────┤
│                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │ Title
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │
│                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │ Summary
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓               │
│                                 │
│  ▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓            │ Tags
│                                 │
│  ● ▓▓▓▓▓▓▓                     │ Author
│                                 │
│  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓              │ Metadata
│                                 │
└─────────────────────────────────┘
```

All skeletons use:
- `animate-pulse` class
- Gray-200 (light mode) / Gray-800 (dark mode)
- Match exact dimensions of real content

---

## Usage Patterns

### Homepage Hero Section
```tsx
<ArticleCard variant="featured" article={featuredArticle} />
```

### Article Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {articles.map(article => (
    <ArticleCard key={article.id} variant="grid" article={article} />
  ))}
</div>
```

### Search Results
```tsx
<div className="space-y-4">
  {results.map(article => (
    <ArticleCard key={article.id} variant="list" article={article} />
  ))}
</div>
```

### Sidebar Widget
```tsx
<aside>
  <h3>Related Articles</h3>
  <div className="space-y-3">
    {related.map(article => (
      <ArticleCard
        key={article.id}
        variant="compact"
        article={article}
        showBookmark={false}
      />
    ))}
  </div>
</aside>
```

### Full Page Layout
```tsx
<div className="container">
  {/* Featured */}
  <ArticleCard variant="featured" article={featured} />

  {/* Main Content + Sidebar */}
  <div className="grid lg:grid-cols-3 gap-6 mt-8">
    {/* Main - 2 columns */}
    <div className="lg:col-span-2 space-y-4">
      {articles.map(article => (
        <ArticleCard variant="list" article={article} />
      ))}
    </div>

    {/* Sidebar - 1 column */}
    <aside className="space-y-3">
      <h3>Trending</h3>
      {trending.map(article => (
        <ArticleCard variant="compact" article={article} />
      ))}
    </aside>
  </div>
</div>
```

---

## Accessibility Indicators

```
┌─────────────────────────────────────┐
│ <article>                  [role]   │  Semantic HTML
│   <a href="/news/slug">    [link]   │  Main link
│     <img alt="Title">     [image]  │  Alt text
│     <h3>Title</h3>        [heading]│  Proper heading
│     <time datetime="..."> [time]   │  Machine readable
│   </a>                              │
│   <button                           │
│     aria-label="Bookmark"  [label] │  Screen reader text
│     aria-pressed="false"   [state] │  Toggle state
│   >                                 │
│     🔖                               │
│   </button>                         │
└─────────────────────────────────────┘
```

---

## Dark Mode Comparison

```
Light Mode                    Dark Mode
┌──────────────────┐         ┌──────────────────┐
│ bg-white         │         │ bg-gray-950      │
│ text-gray-900    │         │ text-gray-50     │
│ border-gray-200  │         │ border-gray-800  │
│                  │         │                  │
│  Article Card    │         │  Article Card    │
│  Content         │         │  Content         │
│                  │         │                  │
└──────────────────┘         └──────────────────┘
```

All components automatically adapt to dark mode using Tailwind's `dark:` variant classes.

---

## Size Comparison Chart

```
Variant     Width      Height    Image     Tags  Metadata
─────────────────────────────────────────────────────────
Grid        flexible   ~400px    192px     3     Full
List        flexible   ~180px    128×128   3     Full
Featured    flexible   ~450px    320-384   ∞     Partial
Compact     flexible   ~100px    80×80     2     Minimal
```

---

## Quick Reference

| Need to...                          | Use Variant |
|-------------------------------------|-------------|
| Show articles in a grid             | `grid`      |
| Display search results              | `list`      |
| Highlight a featured article        | `featured`  |
| Show related articles in sidebar    | `compact`   |
| Show trending articles              | `compact`   |
| Display author's articles           | `list`      |
| Homepage article feed               | `grid`      |
| Category page articles              | `grid`      |

---

## Performance Tips

1. **Use skeletons during loading**
   ```tsx
   {isLoading ? <ArticleCardSkeleton count={6} /> : <ArticleCard />}
   ```

2. **Lazy load images**
   - All images use `loading="lazy"` by default

3. **Use appropriate variant**
   - Compact variant uses less resources
   - Featured variant for 1-2 articles max

4. **Virtualize long lists**
   - For 100+ articles, use react-window or react-virtual

5. **Optimize images**
   - Backend should support `?w=400` and `?w=800` parameters
   - Use WebP format when possible

---

## Browser Rendering

All variants are optimized for:
- Modern flexbox/grid layout
- CSS transforms (scale, translate)
- CSS transitions (smooth animations)
- Responsive images (srcset, sizes)
- Lazy loading (intersection observer)

Tested and working on:
✅ Chrome/Edge 120+
✅ Firefox 121+
✅ Safari 17+
✅ iOS Safari 15+
✅ Chrome Android

---

This visual guide provides a complete reference for implementing and using ArticleCard components throughout the Neurmatic platform.
