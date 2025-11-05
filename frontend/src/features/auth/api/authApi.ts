import axios from 'axios';
import type { LoginFormData, RegisterFormData, AuthResponse, OAuthProvider } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// Axios instance with credentials (for cookies)
const authClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add access token to requests if available
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Login with email and password
 */
export const login = async (data: LoginFormData): Promise<AuthResponse> => {
  const response = await authClient.post<AuthResponse>('/auth/login', {
    email: data.email,
    password: data.password,
  });
  return response.data;
};

/**
 * Register a new user
 */
export const register = async (data: Omit<RegisterFormData, 'confirmPassword'>): Promise<AuthResponse> => {
  const response = await authClient.post<AuthResponse>('/auth/register', {
    username: data.username,
    email: data.email,
    password: data.password,
  });
  return response.data;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  await authClient.post('/auth/logout');
};

/**
 * Refresh the access token using the refresh token cookie
 */
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await authClient.post<{ accessToken: string }>('/auth/refresh');
  return response.data;
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthResponse['user']> => {
  const response = await authClient.get<AuthResponse['user']>('/auth/me');
  return response.data;
};

/**
 * Initiate OAuth flow (opens popup or redirects)
 */
export const initiateOAuth = (provider: OAuthProvider): void => {
  const oauthUrl = `${API_URL}/auth/${provider}`;

  // Open OAuth in popup
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    oauthUrl,
    `${provider}_oauth`,
    `width=${width},height=${height},left=${left},top=${top}`
  );
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await authClient.post('/auth/forgot-password', { email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await authClient.post('/auth/reset-password', { token, newPassword });
};

/**
 * Verify email address with token
 */
export const verifyEmail = async (token: string): Promise<void> => {
  await authClient.post('/auth/verify-email', { token });
};

/**
 * Resend verification email
 */
export const resendVerification = async (): Promise<void> => {
  await authClient.post('/auth/resend-verification');
};

export default {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  initiateOAuth,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
};
