import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import * as authApi from '../api/authApi';
import type { LoginFormData, RegisterFormData, OAuthProvider } from '../types';

interface UseAuthOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

/**
 * Custom hook for authentication operations
 */
export const useAuth = (options: UseAuthOptions = {}) => {
  const { onSuccess, onError, redirectTo = '/dashboard' } = options;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: setAuthState, logout: clearAuthState } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setAuthState(data.user, data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Initialize CSRF token after successful login
      try {
        await apiClient.initializeCsrfToken();
      } catch (error) {
        console.error('Failed to initialize CSRF token after login:', error);
      }

      navigate(redirectTo);
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error as Error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authApi.register({
        username: data.username,
        email: data.email,
        password: data.password,
      }),
    onSuccess: async (data) => {
      setAuthState(data.user, data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Initialize CSRF token after successful registration
      try {
        await apiClient.initializeCsrfToken();
      } catch (error) {
        console.error('Failed to initialize CSRF token after registration:', error);
      }

      navigate(redirectTo);
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error as Error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuthState();
      queryClient.clear();
      // Clear CSRF token on logout
      apiClient.clearCsrfToken();
      navigate('/');
      onSuccess?.();
    },
    onError: (error) => {
      // Still clear local state even if API call fails
      clearAuthState();
      queryClient.clear();
      // Clear CSRF token even if logout fails
      apiClient.clearCsrfToken();
      navigate('/');
      onError?.(error as Error);
    },
  });

  // OAuth handler
  const handleOAuth = useCallback((provider: OAuthProvider) => {
    authApi.initiateOAuth(provider);

    // Listen for OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-success') {
        const { user, accessToken } = event.data;
        setAuthState(user, accessToken);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });

        // Initialize CSRF token after successful OAuth
        try {
          await apiClient.initializeCsrfToken();
        } catch (error) {
          console.error('Failed to initialize CSRF token after OAuth:', error);
        }

        navigate(redirectTo);
        onSuccess?.();
      } else if (event.data.type === 'oauth-error') {
        onError?.(new Error(event.data.message || 'OAuth authentication failed'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
    }, 5 * 60 * 1000);
  }, [setAuthState, queryClient, navigate, redirectTo, onSuccess, onError]);

  // Login handler
  const handleLogin = useCallback(async (data: LoginFormData) => {
    return loginMutation.mutateAsync(data);
  }, [loginMutation]);

  // Register handler
  const handleRegister = useCallback(async (data: RegisterFormData) => {
    return registerMutation.mutateAsync(data);
  }, [registerMutation]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    handleOAuth,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
};

export default useAuth;
