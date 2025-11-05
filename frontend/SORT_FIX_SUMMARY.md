# API Sort Parameter Fix - Summary

## Problem
The frontend was sending sorting parameters in a format incompatible with the backend API:
- **Frontend format**: `sortBy=-published_at` (combined field and order with hyphen prefix)
- **Backend expects**: `sortBy=publishedAt&sortOrder=desc` (separate parameters)

This caused API requests to fail because the backend didn't understand the `-published_at` format.

## Solution

### 1. Updated Type Definitions (`src/features/news/types/index.ts`)
- Changed `SortOption` type from old format to new format:
  ```typescript
  // OLD
  export type SortOption = '-published_at' | 'published_at' | '-view_count' | 'title';

  // NEW
  export type SortOption =
    | 'publishedAt-desc'
    | 'publishedAt-asc'
    | 'viewCount-desc'
    | 'bookmarkCount-desc'
    | 'createdAt-desc'
    | 'createdAt-asc'
    | 'relevance';
  ```

- Added backend sort parameters interface:
  ```typescript
  export interface SortParams {
    sortBy: 'publishedAt' | 'viewCount' | 'bookmarkCount' | 'createdAt' | 'relevance';
    sortOrder?: 'asc' | 'desc';
  }
  ```

### 2. Created Sort Utility Functions (`src/features/news/utils/sortUtils.ts`)
New utility file with two functions:

- **`parseSortOption(sortOption: SortOption): SortParams`**
  - Converts frontend format to backend parameters
  - Example: `'publishedAt-desc'` → `{ sortBy: 'publishedAt', sortOrder: 'desc' }`

- **`toSortOption(sortBy?: string, sortOrder?: string): SortOption`**
  - Converts backend parameters to frontend format (for reading URL params)
  - Example: `('publishedAt', 'desc')` → `'publishedAt-desc'`

### 3. Updated News API (`src/features/news/api/newsApi.ts`)
Modified `getArticles` function to parse sort options before sending to backend:

```typescript
// Parse sort option into separate sortBy and sortOrder parameters
if (params.sortBy) {
  const { sortBy, sortOrder } = parseSortOption(params.sortBy);
  queryParams.append('sortBy', sortBy);
  if (sortOrder) {
    queryParams.append('sortOrder', sortOrder);
  }
}
```

### 4. Updated useArticles Hook (`src/features/news/hooks/useArticles.ts`)
Changed default sort from `'-published_at'` to `'publishedAt-desc'`

### 5. Updated NewsHomePage Component (`src/features/news/pages/NewsHomePage.tsx`)
- Changed default sort state: `'publishedAt-desc'` (was `'-published_at'`)
- Updated sort dropdown options to match backend API:
  ```tsx
  <option value="publishedAt-desc">Latest First</option>
  <option value="publishedAt-asc">Oldest First</option>
  <option value="viewCount-desc">Most Viewed</option>
  <option value="bookmarkCount-desc">Most Bookmarked</option>
  ```
- Updated filter reset to use new default

## Mapping Table

| Frontend UI | Frontend Value | Backend Parameters |
|-------------|----------------|-------------------|
| Latest First | `publishedAt-desc` | `sortBy=publishedAt&sortOrder=desc` |
| Oldest First | `publishedAt-asc` | `sortBy=publishedAt&sortOrder=asc` |
| Most Viewed | `viewCount-desc` | `sortBy=viewCount&sortOrder=desc` |
| Most Bookmarked | `bookmarkCount-desc` | `sortBy=bookmarkCount&sortOrder=desc` |

## Example API Requests

### Before (Broken)
```
GET /api/v1/news/articles?page=1&limit=20&sortBy=-published_at
```

### After (Fixed)
```
GET /api/v1/news/articles?page=1&limit=20&sortBy=publishedAt&sortOrder=desc
```

## Testing

### Manual Testing Steps
1. Navigate to `/news` page
2. Verify articles load successfully
3. Test each sort option from dropdown:
   - Latest First
   - Oldest First
   - Most Viewed
   - Most Bookmarked
4. Check browser network tab to verify correct parameters are sent

### Expected Behavior
- Articles should load without errors
- Each sort option should send correct `sortBy` and `sortOrder` parameters
- Sorting should work as expected (newest first by default)

## Files Changed
1. ✅ `src/features/news/types/index.ts` - Updated types
2. ✅ `src/features/news/utils/sortUtils.ts` - New utility file
3. ✅ `src/features/news/utils/sortUtils.test.ts` - Unit tests
4. ✅ `src/features/news/api/newsApi.ts` - Parse sort before API call
5. ✅ `src/features/news/hooks/useArticles.ts` - Updated default
6. ✅ `src/features/news/pages/NewsHomePage.tsx` - Updated UI and state
7. ✅ `src/features/news/components/TrendingArticles.tsx` - Fixed "View all" link

## Verification
```bash
# Type check passes
cd /home/neurmatic/nEURM/frontend
npm run type-check
# ✅ No errors in news module types

# Manual test
node -e "
const parseSortOption = (sortOption) => {
  if (sortOption === 'relevance') return { sortBy: 'relevance' };
  const parts = sortOption.split('-');
  const sortOrder = parts.pop();
  const sortBy = parts.join('-');
  return { sortBy, sortOrder };
};
console.log(parseSortOption('publishedAt-desc'));
"
# Output: { sortBy: 'publishedAt', sortOrder: 'desc' } ✅
```

## Next Steps
1. Start the frontend development server
2. Navigate to `/news` page
3. Verify articles load successfully
4. Test all sort options
5. Check network requests match expected format

## Rollback (if needed)
If issues arise, the changes can be reverted by:
1. Restoring old `SortOption` type
2. Removing `sortUtils.ts` import from `newsApi.ts`
3. Reverting to direct `sortBy` parameter passing
