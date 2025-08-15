import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  name?: string
  image?: string
}

export interface AuthSession {
  user: User
  accessToken: string
  expires: string
}

export function useAuthSession() {
  const { data: session, status } = useSession()

  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async () => {
      const response = await api.get<AuthSession>('/auth/session')
      return response.data.data
    },
    enabled: !!session?.user && status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  })
}

export function useProfile() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const response = await api.get<User>('/auth/profile')
      return response.data.data
    },
    enabled: !!session?.user,
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.clear()
      toast.success('Signed out successfully')
    },
    onError: () => {
      queryClient.clear()
    },
  })
}
