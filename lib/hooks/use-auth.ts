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

export interface Category {
  id: string
  name: string
  description: string
  color: string
  emailCount: number
}

export interface GmailAccount {
  id: string
  email: string
  name: string
  isActive: boolean
  lastSync: Date
  emailCount: number
}

export interface Email {
  id: string
  subject: string
  fromEmail: string
  fromName: string
  receivedAt: string
  aiSummary: string
  body: string
  hasAttachments: boolean
  isRead: boolean
  category: string
  aiConfidence: number
  priority: 'high' | 'medium' | 'low'
}

export interface AppDependencies {
  user: User
  categories: Category[]
  gmailAccounts: (Omit<GmailAccount, 'lastSync'> & { lastSync: string })[]
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

export function useAppDependencies() {
  const { data: session, status } = useSession()

  return useQuery<AppDependencies>({
    queryKey: queryKeys.auth.dependencies,
    queryFn: async (): Promise<AppDependencies> => {
      const response = await api.get<AppDependencies>('/auth/dependencies')
      return response.data.data
    },
    enabled: !!session?.user && status === 'authenticated',
    staleTime: 5 * 60 * 1000,
    retry: 2,
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
