import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

interface ApiError {
  message: string
  code?: string
  details?: any
}

interface UseMutationWithToastOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError' | 'onSuccess'> {
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string | ((error: TError) => string)
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

export function useMutationWithToast<TData = unknown, TError = AxiosError<ApiError>, TVariables = void, TContext = unknown>(
  options: UseMutationWithToastOptions<TData, TError, TVariables, TContext>
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
    ...mutationOptions
  } = options

  return useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (showSuccessToast && successMessage) {
        const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
        toast.success(message)
      }
      onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      if (showErrorToast) {
        let message = 'An error occurred'
        
        if (errorMessage) {
          message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage
        } else if (error instanceof AxiosError && error.response?.data?.message) {
          message = error.response.data.message
        } else if (error instanceof Error) {
          message = error.message
        }
        
        toast.error(message)
      }
      onError?.(error, variables, context)
    },
  })
}

export function useOptimisticUpdate<TData, TVariables = any>(
  queryKey: any[],
  updateFn: (oldData: TData | undefined, newData: TVariables) => TData
) {
  const queryClient = useQueryClient()

  return useMutation<
    TVariables,
    AxiosError<ApiError>,
    TVariables,
    { previousData: TData | undefined }
  >({
    mutationFn: async (data: TVariables) => data,
    onMutate: async (newData: TVariables): Promise<{ previousData: TData | undefined }> => {
      await queryClient.cancelQueries({ queryKey })
      
      const previousData = queryClient.getQueryData<TData>(queryKey)
      
      queryClient.setQueryData<TData>(queryKey, (old: TData | undefined) => updateFn(old, newData))
      
      return { previousData }
    },
    onError: (_err, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onSuccess: () => {
      // No toast for optimistic updates
    },
  })
}
