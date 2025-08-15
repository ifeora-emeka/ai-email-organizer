'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

interface QueryProviderProps {
  children: ReactNode
}

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          const axiosError = error as AxiosError
          
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            return false
          }
          
          if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            return false
          }
          
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (failureCount, error) => {
          const axiosError = error as AxiosError
          
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            return false
          }
          
          if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            return false
          }
          
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onError: (error) => {
          const axiosError = error as AxiosError
          const message = (axiosError.response?.data as any)?.message || axiosError.message || 'An error occurred'
          
          if (axiosError.response?.status !== 401) {
            toast.error(message)
          }
        },
      },
    },
  })
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
