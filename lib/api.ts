import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This ensures cookies are sent with requests
});

apiClient.interceptors.request.use(
  async (config) =>
  {
    const session = await getSession();
    if (session?.user) {
      config.headers[ 'X-User-Email' ] = session.user.email;
    }
    return config;
  },
  (error) =>
  {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) =>
  {
    return response;
  },
  async (error: AxiosError) =>
  {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await signOut({ redirect: false });
        window.location.href = '/';
      } catch (refreshError) {
        await signOut({ redirect: false });
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any>
{
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError
{
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T>
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.get(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.post(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.put(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.patch(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.delete(url, config),
};

export default api;
