# Authentication Feature

This feature provides a complete authentication UI with login and registration modals.

## Components

### AuthModal

The main authentication modal that handles both login and registration views.

**Usage:**

```tsx
import { AuthModal } from '@/features/auth';
import { useUIStore } from '@/store/uiStore';

function MyComponent() {
  const { authModalOpen, authModalView, openAuthModal, closeAuthModal } = useUIStore();

  return (
    <>
      <button onClick={() => openAuthModal('login')}>Login</button>
      <button onClick={() => openAuthModal('register')}>Sign Up</button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        defaultView={authModalView}
        redirectTo="/dashboard"
      />
    </>
  );
}
```

### LoginForm

Standalone login form component with email/password fields and OAuth options.

**Props:**
- `onSubmit: (data: LoginFormData) => Promise<void>` - Login submission handler
- `onSwitchToRegister: () => void` - Switch to registration view
- `onForgotPassword: () => void` - Forgot password handler
- `onOAuthClick: (provider: OAuthProvider) => void` - OAuth provider handler
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message to display

### RegisterForm

Standalone registration form component with username, email, password fields and OAuth options.

**Props:**
- `onSubmit: (data: RegisterFormData) => Promise<void>` - Registration submission handler
- `onSwitchToLogin: () => void` - Switch to login view
- `onOAuthClick: (provider: OAuthProvider) => void` - OAuth provider handler
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message to display

### OAuthButtons

OAuth provider buttons (Google, GitHub, LinkedIn).

**Props:**
- `onOAuthClick: (provider: OAuthProvider) => void` - OAuth provider handler
- `isLoading?: boolean` - Loading state

## Hooks

### useAuth

Custom hook for authentication operations with TanStack Query integration.

**Usage:**

```tsx
import { useAuth } from '@/features/auth';

function MyComponent() {
  const {
    login,
    register,
    logout,
    handleOAuth,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    loginError,
    registerError,
  } = useAuth({
    redirectTo: '/dashboard',
    onSuccess: () => console.log('Success!'),
    onError: (error) => console.error(error),
  });

  return (
    // Your component
  );
}
```

## API

### authApi

API client functions for authentication operations.

**Functions:**
- `login(data: LoginFormData): Promise<AuthResponse>` - Login with email/password
- `register(data: RegisterFormData): Promise<AuthResponse>` - Register new user
- `logout(): Promise<void>` - Logout current user
- `refreshToken(): Promise<{ accessToken: string }>` - Refresh access token
- `getCurrentUser(): Promise<User>` - Get current authenticated user
- `initiateOAuth(provider: OAuthProvider): void` - Start OAuth flow
- `requestPasswordReset(email: string): Promise<void>` - Request password reset

## Types

```tsx
type LoginFormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type OAuthProvider = 'google' | 'linkedin' | 'github';

type AuthView = 'login' | 'register';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
```

## Features

### Form Validation

- Real-time validation with Zod schemas
- Password strength requirements
- Email format validation
- Username format validation (3-30 chars, alphanumeric + underscore/hyphen)

### Security

- Password visibility toggle
- CSRF protection via cookies
- JWT access token stored in localStorage
- Refresh token stored in HTTPOnly cookie
- OAuth via secure popup window

### Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Focus management
- Error announcements via `aria-live`

### UI/UX

- Loading states during submission
- Error message display
- Switch between login/register
- OAuth provider buttons
- Forgot password link
- Remember me checkbox (login)
- Terms and Privacy links (registration)
- Responsive design (mobile-friendly)

## Integration

The authentication feature is integrated with:

1. **Header Component** - Login/Sign Up buttons open the AuthModal
2. **MobileNav Component** - Mobile navigation includes auth buttons
3. **UI Store** - Global state for modal open/close
4. **Auth Store** - User state management with Zustand
5. **TanStack Query** - API calls with caching and mutations

## Backend API Requirements

The frontend expects the following backend endpoints:

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `GET /api/v1/auth/google` - Google OAuth (opens in popup)
- `GET /api/v1/auth/github` - GitHub OAuth (opens in popup)
- `GET /api/v1/auth/linkedin` - LinkedIn OAuth (opens in popup)

## OAuth Flow

1. User clicks OAuth button
2. Popup window opens with OAuth provider URL
3. User authenticates with provider
4. Backend redirects to callback URL
5. Callback page posts message to parent window with user data
6. Parent window receives message and updates auth state
7. Popup closes automatically

## Future Enhancements

- [ ] Email verification flow
- [ ] Password reset flow (UI + logic)
- [ ] 2FA setup UI
- [ ] Social account linking
- [ ] Account deletion
- [ ] Profile management integration
