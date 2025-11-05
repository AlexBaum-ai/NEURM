# Forum Module Integration Guide

## Quick Start

### 1. Database Setup

**Run migrations:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_forum_category_features
```

**Seed forum categories:**
```bash
npm run prisma:seed
```

This will create 12 predefined forum categories with proper hierarchy.

### 2. Register Dependencies

**In your main application file (e.g., `src/app.ts` or `src/server.ts`):**

```typescript
import { registerForumDependencies } from '@/modules/forum';
import prisma from '@/config/database';

// Register forum module dependencies
registerForumDependencies(prisma);
```

### 3. Mount Routes

**In your main routes file (e.g., `src/routes/index.ts`):**

```typescript
import forumRoutes from '@/modules/forum/routes';

// Mount forum routes
router.use('/forum', forumRoutes);
```

**Full routes will be:**
- `GET /api/v1/forum/categories`
- `GET /api/v1/forum/categories/:slug`
- `POST /api/v1/forum/categories` (admin only)
- etc.

## Environment Variables

Ensure these are set in your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/neurmatic"

# JWT (for authentication)
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Sentry (for error tracking)
SENTRY_DSN="your-sentry-dsn"

# Redis (for rate limiting - optional)
REDIS_URL="redis://localhost:6379"
```

## Testing the API

### Manual Testing

**1. Get all categories (public):**
```bash
curl http://localhost:3000/api/v1/forum/categories
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "General Discussion",
        "slug": "general-discussion",
        "description": "...",
        "level": 1,
        "children": []
      }
    ],
    "count": 12
  }
}
```

**2. Get category by slug (public):**
```bash
curl http://localhost:3000/api/v1/forum/categories/general-discussion
```

**3. Create category (admin only - requires token):**

First, get an admin token (you'll need to implement/use your auth endpoints):
```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neurmatic.com",
    "password": "your-password"
  }'
```

Then create a category:
```bash
curl -X POST http://localhost:3000/api/v1/forum/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "slug": "test-category",
    "description": "A test category",
    "icon": "🧪",
    "visibility": "public",
    "guidelines": "Test guidelines"
  }'
```

**4. Update category (admin only):**
```bash
curl -X PUT http://localhost:3000/api/v1/forum/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description"
  }'
```

**5. Assign moderator (admin only):**
```bash
curl -X POST http://localhost:3000/api/v1/forum/categories/CATEGORY_ID/moderators \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID"
  }'
```

**6. Reorder categories (admin only):**
```bash
curl -X PUT http://localhost:3000/api/v1/forum/categories/reorder \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [
      {"id": "uuid-1", "displayOrder": 0},
      {"id": "uuid-2", "displayOrder": 1},
      {"id": "uuid-3", "displayOrder": 2}
    ]
  }'
```

### Testing with Postman

**Import this collection:**

1. Create a new Postman collection "Forum Categories API"
2. Add environment variables:
   - `base_url`: `http://localhost:3000/api/v1`
   - `admin_token`: Your admin JWT token

3. Add these requests:

**GET All Categories**
- Method: GET
- URL: `{{base_url}}/forum/categories`

**GET Category by Slug**
- Method: GET
- URL: `{{base_url}}/forum/categories/general-discussion`

**POST Create Category**
- Method: POST
- URL: `{{base_url}}/forum/categories`
- Headers: `Authorization: Bearer {{admin_token}}`
- Body (JSON):
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Description here"
}
```

## Integration with Frontend

### Example: Fetch Categories in React

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  level: number;
  children: Category[];
  topicCount: number;
  replyCount: number;
}

export function useForumCategories() {
  return useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const response = await axios.get<{
        success: boolean;
        data: { categories: Category[]; count: number };
      }>('/api/v1/forum/categories');
      return response.data.data;
    },
  });
}

// Usage in component
function ForumHome() {
  const { data, isLoading, error } = useForumCategories();

  if (isLoading) return <div>Loading categories...</div>;
  if (error) return <div>Error loading categories</div>;

  return (
    <div>
      {data?.categories.map(category => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
```

### Example: Create Category (Admin)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  guidelines?: string;
  visibility?: 'public' | 'private' | 'moderator_only';
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await axios.post(
        '/api/v1/forum/categories',
        data,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
    },
  });
}
```

## Monitoring & Debugging

### Sentry Integration

All errors are automatically tracked in Sentry with context:

```typescript
// Example of logged context:
{
  tags: {
    service: 'forumCategoryService',
    method: 'createCategory'
  },
  extra: {
    data: { name: 'Test', slug: 'test' },
    userId: 'uuid'
  }
}
```

View errors in Sentry dashboard under:
- Service: `forumCategoryService`
- Controller: `ForumCategoryController`

### Logging

All operations are logged using Winston:

```typescript
logger.debug(`User authenticated: ${user.id}`);
logger.error('Controller error:', error);
```

Check logs in:
- Development: Console output
- Production: Log files or log aggregation service

### Rate Limiting

Monitor rate limit headers in responses:

```
RateLimit-Limit: 60
RateLimit-Remaining: 59
RateLimit-Reset: 1699564800
```

If rate limited, response will be:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later"
  }
}
```

## Troubleshooting

### Issue: "Category slug already exists"

**Problem:** Trying to create a category with a slug that's already in use.

**Solution:**
1. Check existing categories: `GET /api/forum/categories`
2. Choose a different slug
3. Or update the existing category: `PUT /api/forum/categories/:id`

### Issue: "Maximum category depth is 2 levels"

**Problem:** Trying to create a subcategory under another subcategory.

**Solution:** Categories can only be 2 levels deep. Create it as a main category or under a level-1 category.

### Issue: "Cannot delete category with existing topics"

**Problem:** Trying to delete a category that has topics.

**Solution:**
1. Move topics to another category first
2. Or delete all topics
3. Then delete the category

### Issue: "Authentication required"

**Problem:** Trying to access admin endpoint without token.

**Solution:**
1. Login as admin: `POST /api/auth/login`
2. Get the JWT token from response
3. Add header: `Authorization: Bearer YOUR_TOKEN`

### Issue: Prisma client not generated

**Problem:** Import errors or missing types.

**Solution:**
```bash
npx prisma generate
```

### Issue: Database out of sync

**Problem:** Schema changes not reflected in database.

**Solution:**
```bash
npx prisma migrate dev
# or
npx prisma db push  # for development only
```

## Performance Optimization

### Database Query Optimization

The repository uses optimized queries:
- Eager loading of related data (children, moderators)
- Indexed fields for fast lookups (slug, parentId)
- Batch operations for reordering

### Caching (Optional)

Add Redis caching for frequently accessed data:

```typescript
import { redisClient } from '@/config/redis';

// Cache category tree for 5 minutes
async getCategoryTree() {
  const cacheKey = 'forum:categories:tree';
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const categories = await this.categoryRepository.findAllWithHierarchy();
  await redisClient.setex(cacheKey, 300, JSON.stringify(categories));

  return categories;
}
```

## Security Checklist

- [x] Input validation with Zod
- [x] Authentication middleware
- [x] Role-based authorization
- [x] Rate limiting
- [x] Soft deletes (data preservation)
- [x] Sentry error tracking
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (input sanitization)
- [x] CSRF protection (use CSRF tokens in frontend)

## API Endpoint Summary

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/forum/categories` | Public | Get category tree |
| GET | `/api/forum/categories/:slug` | Public | Get category by slug |
| GET | `/api/forum/categories/:id/moderators` | Public | Get moderators |
| POST | `/api/forum/categories` | Admin | Create category |
| PUT | `/api/forum/categories/:id` | Admin | Update category |
| DELETE | `/api/forum/categories/:id` | Admin | Delete category |
| PUT | `/api/forum/categories/reorder` | Admin | Reorder categories |
| POST | `/api/forum/categories/:id/moderators` | Admin | Assign moderator |
| DELETE | `/api/forum/categories/:id/moderators/:userId` | Admin | Remove moderator |

## Next Steps

After successful integration:

1. **Test all endpoints** using the examples above
2. **Verify seeded data** in Prisma Studio: `npm run prisma:studio`
3. **Check error tracking** in Sentry dashboard
4. **Monitor rate limits** during testing
5. **Implement frontend UI** (SPRINT-4-002)
6. **Move to topics implementation** (SPRINT-4-003)

## Support

For issues or questions:
- Check `/backend/src/modules/forum/README.md` for detailed documentation
- Review Prisma schema: `/backend/src/prisma/schema.prisma`
- Check API specification: `/projectdoc/03-API_ENDPOINTS.md`
- View sprint tasks: `.claude/sprints/sprint-4.json`

---

**Last Updated:** November 2025
**Sprint:** SPRINT-4-001
**Status:** ✅ Ready for Integration
