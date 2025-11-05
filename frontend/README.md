# Neurmatic Frontend

> React + TypeScript + Vite frontend for the Neurmatic platform

## Overview

The Neurmatic frontend is a modern, performant web application built with React 18, TypeScript, and Vite. It provides an intuitive interface for the LLM community platform, featuring authentication, internationalization, dark mode, and responsive design.

## Features

- **Modern React**: React 18+ with TypeScript for type safety
- **Fast Development**: Vite for instant HMR and optimized builds
- **Styling**: TailwindCSS 4 with Radix UI components
- **State Management**: Zustand for client state, TanStack Query for server state
- **Routing**: React Router v7 with code splitting
- **Internationalization**: i18next with English and Dutch translations
- **Dark Mode**: System preference detection + manual toggle
- **Authentication**: JWT-based auth with OAuth support
- **Accessibility**: WCAG 2.1 AA compliant components

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Backend API** running on `http://localhost:3000` (or configured URL)

## Installation

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000

# Sentry (Optional)
VITE_SENTRY_DSN=your_sentry_dsn

# Environment
VITE_ENV=development
```

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at: `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000/api/v1` |
| `VITE_WS_URL` | WebSocket URL for real-time features | `ws://localhost:3000` |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | (optional) |
| `VITE_ENV` | Environment name | `development` |

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the application.

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Fix linting issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types without building |
| `npm test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with interactive UI |
| `npm run test:coverage` | Generate test coverage report |

### Development Server

Start the dev server:

```bash
npm run dev
```

Features:
- **Hot Module Replacement (HMR)**: Instant updates without full page reload
- **Fast Refresh**: Preserves component state during updates
- **TypeScript checking**: Type errors in browser console

### Production Build

Create optimized production build:

```bash
npm run build
```

Output in `dist/` directory:
- Minified JavaScript bundles
- Optimized CSS
- Static assets with cache busting
- Source maps (for debugging)

Preview build locally:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/                  # Static assets
│   └── locales/            # i18n translation files
│       ├── en/             # English translations
│       │   └── translation.json
│       └── nl/             # Dutch translations
│           └── translation.json
│
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── auth/          # Authentication
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── types.ts
│   │   ├── news/          # News module (future)
│   │   ├── forum/         # Forum module (future)
│   │   └── jobs/          # Jobs module (future)
│   │
│   ├── components/         # Shared components
│   │   ├── common/        # Generic components (Button, Input, etc.)
│   │   ├── layout/        # Layout components (Header, Footer, Sidebar)
│   │   └── ui/            # Radix UI wrapper components
│   │
│   ├── lib/               # Utilities and configurations
│   │   ├── api.ts         # Axios API client
│   │   ├── queryClient.ts # TanStack Query configuration
│   │   └── utils.ts       # Helper functions
│   │
│   ├── stores/            # Zustand stores
│   │   ├── authStore.ts   # Authentication state
│   │   └── uiStore.ts     # UI state (theme, sidebar, etc.)
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   └── useTheme.ts    # Theme management hook
│   │
│   ├── types/             # TypeScript type definitions
│   │   ├── api.ts         # API response types
│   │   └── user.ts        # User-related types
│   │
│   ├── styles/            # Global styles
│   │   └── index.css      # Tailwind imports + custom styles
│   │
│   ├── i18n.ts            # i18next configuration
│   ├── router.tsx         # React Router configuration
│   ├── App.tsx            # Root component
│   └── main.tsx           # Application entry point
│
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── eslint.config.js        # ESLint configuration
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── package.json
```

## Architecture

### Feature-Based Organization

Each feature is self-contained:

```
features/auth/
├── components/          # Feature-specific components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── OAuth Buttons.tsx
├── hooks/              # Feature-specific hooks
│   └── useAuth.ts
├── pages/              # Feature pages
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
└── types.ts            # Feature types
```

### Component Patterns

#### Suspense Boundaries

Use React Suspense for lazy loading:

```typescript
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPage />
    </Suspense>
  );
}
```

**Important**: Do NOT use early returns with loading spinners. Always use Suspense boundaries.

#### Data Fetching

Use TanStack Query's `useSuspenseQuery`:

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile() {
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me')
  });

  return <div>{user.username}</div>;
}
```

#### Event Handlers

Use `useCallback` when passing handlers to children:

```typescript
const handleSubmit = useCallback((data: FormData) => {
  // Handle submission
}, [dependencies]);

return <Form onSubmit={handleSubmit} />;
```

### State Management

#### Client State (Zustand)

For UI state and client-side data:

```typescript
// stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      }))
    }),
    { name: 'ui-storage' }
  )
);
```

Usage:

```typescript
function Header() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

#### Server State (TanStack Query)

For API data:

```typescript
// hooks/useUser.ts
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';

export function useCurrentUser() {
  return useSuspenseQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me'),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: (data: UserUpdate) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    }
  });
}
```

### Routing

React Router v7 configuration:

```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'auth',
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> }
        ]
      },
      {
        path: 'profile',
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
      }
    ]
  }
]);
```

Protected routes:

```typescript
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
```

### Styling

#### TailwindCSS

Utility-first CSS framework:

```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>
```

#### Radix UI Components

Accessible, unstyled components:

```typescript
import * as Dialog from '@radix-ui/react-dialog';

function Modal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Open Modal
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
          <Dialog.Title>Modal Title</Dialog.Title>
          <Dialog.Description>Modal content here</Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### Dark Mode

Implemented with class-based strategy:

```css
/* styles/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
}
```

Toggle in component:

```typescript
function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

### Internationalization (i18n)

#### Translation Files

```json
// public/locales/en/translation.json
{
  "auth": {
    "login": "Login",
    "register": "Register",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?"
  },
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "loading": "Loading..."
  }
}
```

#### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function LoginForm() {
  const { t } = useTranslation();

  return (
    <form>
      <label>{t('auth.email')}</label>
      <input type="email" />

      <label>{t('auth.password')}</label>
      <input type="password" />

      <button>{t('auth.login')}</button>
    </form>
  );
}
```

#### Language Switcher

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="nl">Nederlands</option>
    </select>
  );
}
```

## API Integration

### API Client Configuration

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      await refreshToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Authentication Flow

```typescript
// features/auth/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post('/auth/login', credentials),
    onSuccess: (response) => {
      setAuth(response.data.accessToken, response.data.user);
    }
  });
}
```

## Testing

### Test Structure

```
src/
├── features/
│   └── auth/
│       └── __tests__/
│           ├── LoginForm.test.tsx
│           └── useAuth.test.ts
└── components/
    └── common/
        └── __tests__/
            └── Button.test.tsx
```

### Component Testing

```typescript
// components/common/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});
```

### Hook Testing

```typescript
// features/auth/hooks/__tests__/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLogin } from '../useAuth';

describe('useLogin', () => {
  it('logs in successfully', async () => {
    const { result } = renderHook(() => useLogin());

    result.current.mutate({
      email: 'test@example.com',
      password: 'Password123!'
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# UI mode (interactive)
npm run test:ui

# Coverage
npm run test:coverage
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load routes
const NewsPage = lazy(() => import('./features/news/pages/NewsPage'));
const ForumPage = lazy(() => import('./features/forum/pages/ForumPage'));

// In router
{
  path: 'news',
  element: (
    <Suspense fallback={<PageLoader />}>
      <NewsPage />
    </Suspense>
  )
}
```

### Image Optimization

```typescript
<img
  src="/images/hero.jpg"
  alt="Hero"
  loading="lazy"  // Lazy load images
  decoding="async"  // Decode asynchronously
/>
```

### Bundle Size Analysis

```bash
npm run build
```

View bundle visualization:
```bash
npx vite-bundle-visualizer
```

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (last 2 versions)
- Chrome Android (last 2 versions)

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation supported
- Screen reader tested
- Focus management
- ARIA labels and roles

Test accessibility:
```bash
npm run build
npx pa11y-ci http://localhost:4173
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or use env variable
PORT=5174 npm run dev
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Type Errors

```bash
# Regenerate TypeScript definitions
npm run type-check
```

### API Connection Issues

Check:
1. Backend is running on correct port
2. `VITE_API_URL` in `.env` is correct
3. CORS is configured in backend
4. No firewall blocking requests

## Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Environment Variables

Set in deployment platform:

```env
VITE_API_URL=https://api.neurmatic.com/api/v1
VITE_WS_URL=wss://api.neurmatic.com
VITE_SENTRY_DSN=your_production_sentry_dsn
VITE_ENV=production
```

### Static Hosting

Deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **AWS S3 + CloudFront**
- **Nginx**: Serve `dist/` directory

### SPA Routing Configuration

For proper routing, configure server to redirect all routes to `index.html`:

**Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## Support

- **Documentation**: Check `../projectdoc/` directory
- **Issues**: GitHub Issues
- **Email**: dev@neurmatic.com

## License

MIT License - see LICENSE file

---

**Last Updated**: November 2025
