import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import OAuthButtons from './OAuthButtons';
import { registerSchema, type RegisterFormData, type OAuthProvider } from '../types';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onSwitchToLogin: () => void;
  onOAuthClick: (provider: OAuthProvider) => void;
  isLoading?: boolean;
  error?: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSwitchToLogin,
  onOAuthClick,
  isLoading = false,
  error = null,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const togglePasswordVisibility = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = React.useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div
          className="rounded-md bg-accent-50 p-3 text-sm text-accent-700 dark:bg-accent-900/20 dark:text-accent-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div>
        <Input
          {...register('username')}
          type="text"
          label="Username"
          placeholder="johndoe"
          error={errors.username?.message}
          disabled={isLoading}
          autoComplete="username"
          aria-required="true"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          3-30 characters, letters, numbers, underscores, and hyphens only
        </p>
      </div>

      <div>
        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={isLoading}
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
      </div>

      <div>
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isLoading}
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Must contain at least 8 characters, including uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <div className="relative">
          <Input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            tabIndex={0}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <OAuthButtons onOAuthClick={onOAuthClick} isLoading={isLoading} />

      <div className="text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="text-primary-600 hover:underline dark:text-primary-400">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
};

export default RegisterForm;
