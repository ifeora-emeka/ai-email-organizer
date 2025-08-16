import { UseMutationOptions, useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';

interface ApiError
{
  message: string;
  code?: string;
  details?: any;
}

interface UseApiQueryOptions<TData, TError = AxiosError<ApiError>>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
{
  url: string;
  queryKey: any[];
  enabled?: boolean;
}

export function useApiQuery<TData = unknown>({
  url,
  queryKey,
  enabled = true,
  ...options
}: UseApiQueryOptions<TData>)
{
  return useQuery({
    queryKey,
    queryFn: async () =>
    {
      const response = await api.get<TData>(url);
      return response.data.data;
    },
    enabled,
    ...options,
  });
}

export function useApiMutation<TData = unknown, TError = AxiosError<ApiError>, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
)
{
  return useMutation({
    ...options,
  });
}

export interface LoadingState
{
  isLoading: boolean;
  isError: boolean;
  error: any;
  isSuccess: boolean;
}

export function useLoadingState(queries: LoadingState[]): LoadingState
{
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const error = queries.find(query => query.error)?.error;
  const isSuccess = queries.every(query => query.isSuccess);

  return {
    isLoading,
    isError,
    error,
    isSuccess,
  };
}

export function useRefreshOnFocus()
{
  const handleFocus = () =>
  {
    document.querySelector('[data-tanstack-query-devtools]')?.remove();
  };

  return { handleFocus };
}
