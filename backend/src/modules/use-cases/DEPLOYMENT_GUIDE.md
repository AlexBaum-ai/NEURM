# Use Cases Library - Deployment Guide

## 🚀 Quick Start

The use cases library backend is **complete and ready for deployment**. Follow these steps to deploy:

---

## 1️⃣ Database Migration

### Run Prisma Migration
```bash
cd /home/user/NEURM/backend

# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev --name add_use_cases_library

# OR run migrations (production)
npx prisma migrate deploy
```

### Verify Migration
```bash
# Check that use_cases table exists
npx prisma studio
# Navigate to use_cases table in the browser
```

---

## 2️⃣ Environment Configuration

### Required Variables (Already Set)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=http://vps-1a707765.vps.ovh.net
```

### Optional Variables
```env
# Redis for caching (recommended)
REDIS_URL=redis://localhost:6379

# Sentry for error tracking (recommended)
SENTRY_DSN=your_sentry_dsn
```

---

## 3️⃣ Start the Server

```bash
cd /home/user/NEURM/backend

# Development
npm run dev

# Production
npm run build
npm start
```

**Server will be available at**: `http://vps-1a707765.vps.ovh.net:3000`

---

## 4️⃣ Test the Endpoints

### Health Check
```bash
curl http://vps-1a707765.vps.ovh.net:3000/health
```

### List Use Cases (Public)
```bash
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/use-cases
```

### Submit Use Case (Authenticated)
```bash
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/use-cases/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Use Case",
    "summary": "This is a test summary that is long enough to pass validation requirements",
    "content": {
      "problem": "This is a problem statement that is long enough to meet validation requirements",
      "solution": "This is the solution description that is long enough to pass validation",
      "results": "These are the results that are long enough to pass validation requirements"
    },
    "techStack": ["GPT-4", "LangChain"],
    "category": "customer_support",
    "industry": "saas",
    "implementationType": "rag"
  }'
```

---

## 5️⃣ Verify Routes are Mounted

Check that routes are registered:

```bash
# This should return the use cases list (empty initially)
curl http://vps-1a707765.vps.ovh.net:3000/api/v1/use-cases
```

Expected response:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

---

## 6️⃣ Run Tests

```bash
cd /home/user/NEURM/backend

# Run all tests
npm test

# Run use case tests only
npm test src/modules/use-cases/__tests__

# Run tests with coverage
npm run test:coverage
```

---

## 7️⃣ Seed Initial Data (Optional)

Create a seed file to add initial use cases:

```typescript
// backend/src/prisma/seeds/useCases.seed.ts
import prisma from '@/config/database';

async function seedUseCases() {
  // Create sample use cases
  await prisma.useCase.create({
    data: {
      slug: 'gpt4-customer-support',
      title: 'GPT-4 Powered Customer Support',
      summary: 'How we reduced support response time by 70% using GPT-4',
      contentJson: {
        problem: 'High volume of repetitive customer support tickets...',
        solution: 'Implemented GPT-4 powered chatbot with RAG...',
        results: '70% faster response time, 40% cost reduction...',
        metrics: [
          {
            name: 'Response Time',
            value: '2.5 minutes (was 8 minutes)',
            description: 'Average first response time'
          }
        ]
      },
      techStack: ['GPT-4', 'LangChain', 'Pinecone'],
      category: 'customer_support',
      industry: 'saas',
      implementationType: 'rag',
      status: 'published',
      featured: true,
      hasCode: false,
      hasRoiData: true,
      authorId: 'ADMIN_USER_ID', // Replace with actual admin user ID
      publishedAt: new Date(),
    }
  });

  console.log('✅ Use cases seeded successfully');
}

seedUseCases()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx ts-node backend/src/prisma/seeds/useCases.seed.ts
```

---

## 8️⃣ Create Admin User (If Needed)

Ensure you have at least one admin user to review submissions:

```typescript
// Update user role to admin
await prisma.user.update({
  where: { email: 'admin@neurmatic.com' },
  data: { role: 'admin' }
});
```

---

## 9️⃣ Monitor & Verify

### Check Logs
```bash
# View application logs
tail -f /path/to/logs/app.log

# Check for errors
grep ERROR /path/to/logs/app.log
```

### Monitor Sentry
- Go to Sentry dashboard
- Check for any errors in use-cases module

### Monitor Redis (if enabled)
```bash
redis-cli
> KEYS use-case:*
> KEYS use-cases:*
```

---

## 🔟 Frontend Integration

### API Base URL
```typescript
const API_BASE_URL = 'http://vps-1a707765.vps.ovh.net:3000/api/v1';
```

### Available Endpoints for Frontend
```typescript
// Public endpoints
GET /use-cases                    // List published use cases
GET /use-cases/featured          // Featured use cases
GET /use-cases/:slug             // Use case detail

// Authenticated endpoints
POST /use-cases/submit           // Submit new use case
GET /use-cases/my-submissions    // User's submissions
PUT /use-cases/:id               // Update use case
DELETE /use-cases/:id            // Delete use case

// Admin endpoints
GET /use-cases/admin/all         // All use cases (any status)
PUT /admin/use-cases/:id/review  // Review use case
```

### TypeScript Types for Frontend
```typescript
export enum UseCaseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

export enum UseCaseCategory {
  CUSTOMER_SUPPORT = 'customer_support',
  CODE_GENERATION = 'code_generation',
  DATA_ANALYSIS = 'data_analysis',
  // ... etc
}

export interface UseCase {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentJson: UseCaseContent;
  techStack: string[];
  category: UseCaseCategory;
  industry: string;
  implementationType: string;
  status: UseCaseStatus;
  featured: boolean;
  hasCode: boolean;
  hasRoiData: boolean;
  viewCount: number;
  author: {
    id: string;
    username: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📋 Post-Deployment Checklist

- [ ] Database migration successful
- [ ] Prisma client generated
- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Use cases endpoint returns empty list
- [ ] Submission endpoint requires authentication
- [ ] Admin endpoints require admin role
- [ ] Rate limiting works (5 submissions/hour)
- [ ] Caching works (if Redis enabled)
- [ ] Sentry captures errors (if enabled)
- [ ] Tests pass
- [ ] API documentation accessible

---

## 🐛 Troubleshooting

### Issue: Prisma client errors
**Solution**: Run `npx prisma generate`

### Issue: Migration fails
**Solution**: Check database connection and existing schema

### Issue: Routes not found (404)
**Solution**: Verify routes are mounted in `app.ts`

### Issue: Permission denied
**Solution**: Check JWT token and user role

### Issue: Rate limit errors
**Solution**: Adjust rate limits in `useCase.routes.ts`

### Issue: Cache not working
**Solution**: Check Redis connection, fallback to no-cache is automatic

---

## 📞 Support

### Documentation
- [README.md](./README.md) - API documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation details
- [Project Docs](/projectdoc/) - Overall project documentation

### Testing
- Run tests: `npm test`
- Check coverage: `npm run test:coverage`

### Monitoring
- Application logs: Check console output
- Sentry: Error tracking dashboard
- Redis: `redis-cli MONITOR` for cache operations

---

## ✅ Deployment Status

**Backend Implementation**: ✅ Complete
**Database Schema**: ✅ Ready
**API Endpoints**: ✅ Tested
**Documentation**: ✅ Complete
**Tests**: ✅ Written

**Ready for**:
- ✅ Local development
- ✅ Staging deployment
- ✅ Production deployment
- ✅ Frontend integration

---

**Last Updated**: November 6, 2025
**Status**: 🟢 Ready for Deployment
