import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import OAuthButtons from './OAuthButtons';
import { loginSchema, type LoginFormData, type OAuthProvider } from '../types';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onOAuthClick: (provider: OAuthProvider) => void;
  isLoading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSwitchToRegister,
  onForgotPassword,
  onOAuthClick,
  isLoading = false,
  error = null,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const togglePasswordVisibility = React.useCallback(() => {
    setShowPassword((prev) => !prev);
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
            autoComplete="current-password"
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
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            id="remember-me"
            type="checkbox"
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Remember me
          </label>
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <OAuthButtons onOAuthClick={onOAuthClick} isLoading={isLoading} />

      <div className="text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          disabled={isLoading}
        >
          Sign up
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
