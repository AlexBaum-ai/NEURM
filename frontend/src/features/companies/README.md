# Companies Feature

This feature provides company profile pages and settings for the Neurmatic platform.

## Overview

The companies feature allows companies to create and manage their public profiles, including:
- Company information (name, description, mission)
- Branding (logo, header image)
- Tech stack details (LLM models, frameworks, languages)
- Benefits and perks
- Culture description
- Social media links
- Active job postings
- Follow/unfollow functionality

## Structure

```
companies/
├── api/
│   └── companiesApi.ts       # API client functions
├── components/
│   ├── CompanyHero.tsx        # Hero section with logo and branding
│   ├── CompanyAbout.tsx       # About section with details
│   ├── CompanyJobs.tsx        # Active jobs grid
│   ├── ImageUpload.tsx        # Image upload with preview
│   └── index.ts
├── hooks/
│   └── useCompany.ts          # Data fetching hooks
├── pages/
│   ├── CompanyProfilePage.tsx # Public profile page
│   ├── CompanySettingsPage.tsx # Settings page (owner only)
│   └── index.ts
├── types/
│   └── index.ts               # TypeScript type definitions
├── validation/
│   └── companySchema.ts       # Zod validation schemas
└── index.ts
```

## Routes

- **`/companies/:slug`** - Public company profile page
- **`/companies/:slug/settings`** - Company settings page (company owner only)

## Usage

### Viewing a Company Profile

```tsx
import { Link } from 'react-router-dom';

<Link to={`/companies/${company.slug}`}>
  View Company Profile
</Link>
```

### Company Profile Components

```tsx
import { CompanyHero, CompanyAbout, CompanyJobs } from '@/features/companies';

// Use individual components
<CompanyHero
  company={company}
  isOwner={isOwner}
  isFollowing={isFollowing}
  onFollow={handleFollow}
  onUnfollow={handleUnfollow}
  onEdit={handleEdit}
/>

<CompanyAbout company={company} />
<CompanyJobs jobs={jobs} companyName={company.name} />
```

### Using Company Data Hooks

```tsx
import { useCompany, useFollowCompany, useUpdateCompany } from '@/features/companies';

function CompanyProfile({ slug }) {
  const { company, jobs, jobCount } = useCompany(slug);
  const { follow, unfollow } = useFollowCompany(company.id, slug);
  const updateMutation = useUpdateCompany(company.id);

  const handleUpdate = async (data) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <div>
      <h1>{company.name}</h1>
      <button onClick={follow}>Follow</button>
      {/* ... */}
    </div>
  );
}
```

## API Endpoints

All API functions are available in `api/companiesApi.ts`:

- `getCompanyProfile(id)` - Get company profile by ID or slug
- `listCompanies(params)` - List companies with filters
- `getCompanyJobs(id)` - Get company's active jobs
- `createCompany(data)` - Create company profile
- `updateCompanyProfile(id, data)` - Update company profile (owner only)
- `followCompany(id)` - Follow a company
- `unfollowCompany(id)` - Unfollow a company
- `uploadCompanyLogo(id, file)` - Upload company logo
- `uploadCompanyHeader(id, file)` - Upload header image

## Form Validation

The company settings form uses Zod for validation:

```tsx
import { companySettingsSchema } from '@/features/companies/validation/companySchema';

// Validation rules:
// - name: 2-200 characters (required)
// - description: max 5000 characters
// - website, social links: valid URLs
// - companySize: enum of predefined sizes
// - foundedYear: 1800 - current year
// - locations: max 10, each max 100 chars
// - benefits: max 20, each max 200 chars
```

## Image Upload

Image upload component with validation:

```tsx
import ImageUpload from '@/features/companies/components/ImageUpload';

<ImageUpload
  label="Company Logo"
  currentImage={logoUrl}
  onUpload={handleLogoUpload}
  onRemove={handleLogoRemove}
  maxSize={2} // 2MB for logo
  aspectRatio="1:1"
  height={200}
/>

<ImageUpload
  label="Header Image"
  currentImage={headerImageUrl}
  onUpload={handleHeaderUpload}
  onRemove={handleHeaderRemove}
  maxSize={5} // 5MB for header
  aspectRatio="16:9"
  height={200}
/>
```

**Allowed formats:** JPG, PNG, WebP

## TypeScript Types

All types are exported from `types/index.ts`:

```tsx
import type {
  Company,
  CompanyFormData,
  CompanyJob,
  CompanySize,
  TechStack,
} from '@/features/companies';
```

### Key Types

- **`Company`** - Full company profile data
- **`CompanyFormData`** - Form data for creating/updating
- **`CompanyJob`** - Job posting data
- **`TechStack`** - Tech stack details (models, frameworks, languages)
- **`CompanySize`** - Enum: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+'

## Features

### Public Profile Page

- **Hero Section:**
  - Header image background
  - Company logo
  - Company name with verified badge
  - Follow button with follower count
  - Location, industry, company size
  - Profile view stats

- **About Section:**
  - Description and mission statement
  - Founded year, company size, locations
  - Tech stack (LLM models, frameworks, languages)
  - Benefits and perks list
  - Culture description
  - Social media links

- **Jobs Section:**
  - Grid of active job postings
  - Job cards with title, location, salary, remote type
  - Link to job detail pages
  - Empty state when no jobs

### Company Settings Page

- **Access Control:** Only company owner can edit
- **Form Sections:**
  - Basic Information (name, description, mission)
  - Company Details (industry, size, founded year, locations)
  - Branding (logo, header image upload)
  - Tech Stack (models, frameworks, languages)
  - Benefits & Perks
  - Culture & Values
  - Social Links

- **Features:**
  - Image upload with preview
  - Form validation with error messages
  - Add/remove items (locations, benefits, tech stack)
  - Auto-save warning on page leave
  - Success/error notifications
  - Cancel button with unsaved changes warning

## Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Collapsible sections on mobile
- Touch-friendly buttons and inputs
- Optimized image loading

## SEO Optimization

- Dynamic meta tags (title, description, og:image)
- Canonical URLs
- Structured data for company profiles
- Breadcrumb navigation
- Semantic HTML

## Accessibility

- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Color contrast compliance

## Testing

### Manual Testing Checklist

- [ ] View company profile page
- [ ] Follow/unfollow company (authenticated)
- [ ] Edit company profile (owner only)
- [ ] Upload logo and header images
- [ ] Add/remove locations, benefits, tech stack items
- [ ] Verify form validation
- [ ] Test responsive layout on mobile
- [ ] Verify SEO meta tags
- [ ] Check accessibility with screen reader

### Integration with Backend

The feature integrates with the following backend endpoints:

- `GET /api/v1/companies/:id` - Get company profile
- `PUT /api/v1/companies/:id` - Update company profile
- `GET /api/v1/companies/:id/jobs` - Get company jobs
- `POST /api/v1/companies/:id/follow` - Follow company
- `DELETE /api/v1/companies/:id/follow` - Unfollow company

## Future Enhancements

- [ ] Company reviews and ratings
- [ ] Team members showcase
- [ ] Media gallery for culture photos/videos
- [ ] Company analytics dashboard
- [ ] Email notifications for followers
- [ ] Advanced search and filtering

## Related Features

- **Jobs Module** - Job postings associated with companies
- **Auth Module** - User authentication for follow/edit actions
- **User Module** - Company owner identification

---

**Last Updated:** Sprint 7 - November 2025
