import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://vps-1a707765.vps.ovh.net:3000/api/v1';

export interface APIError {
  message: string;
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;
}

class APIClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;
  private csrfTokenPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * Fetch CSRF token from backend
   * Uses promise caching to prevent concurrent requests
   */
  private async fetchCsrfToken(): Promise<string> {
    // If already fetching, return existing promise
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    // Create new fetch promise
    this.csrfTokenPromise = (async () => {
      try {
        const response = await this.client.get<{ csrfToken: string }>('/csrf-token');
        this.csrfToken = response.data.csrfToken;
        return this.csrfToken;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        throw error;
      } finally {
        // Clear promise cache after completion
        this.csrfTokenPromise = null;
      }
    })();

    return this.csrfTokenPromise;
  }

  /**
   * Clear stored CSRF token (call on logout)
   */
  public clearCsrfToken(): void {
    this.csrfToken = null;
    this.csrfTokenPromise = null;
  }

  /**
   * Initialize CSRF token (call after login)
   */
  public async initializeCsrfToken(): Promise<void> {
    try {
      await this.fetchCsrfToken();
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor - add auth token and CSRF token
    this.client.interceptors.request.use(
      async (config) => {
        // Add JWT access token
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        const method = config.method?.toLowerCase();
        if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
          try {
            // Fetch token if not cached
            if (!this.csrfToken) {
              await this.fetchCsrfToken();
            }
            config.headers['X-CSRF-Token'] = this.csrfToken;
          } catch (error) {
            console.error('Failed to add CSRF token to request:', error);
            // Continue with request even if CSRF token fetch fails
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<APIError>) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
          _csrfRetry?: boolean;
        };

        // Handle 403 Forbidden - might be expired CSRF token
        if (error.response?.status === 403 && !originalRequest._csrfRetry) {
          originalRequest._csrfRetry = true;

          try {
            // Fetch new CSRF token
            this.csrfToken = null; // Clear old token
            const newCsrfToken = await this.fetchCsrfToken();

            // Retry original request with new CSRF token
            if (originalRequest.headers) {
              originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
            }

            return this.client(originalRequest);
          } catch (csrfError) {
            console.error('Failed to refresh CSRF token:', csrfError);
            return Promise.reject(error);
          }
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.client.post('/auth/refresh');
            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('accessToken');
            this.clearCsrfToken();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient(API_URL);
export default apiClient;
