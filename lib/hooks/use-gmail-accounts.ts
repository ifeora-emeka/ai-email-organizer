import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export interface GmailAccount {
  id: string
  userId: string
  email: string
  name?: string
  isActive: boolean
  lastSync?: string
  accessToken: string
  refreshToken?: string
  scope?: string
  createdAt: string
  updatedAt: string
}

export interface CreateGmailAccountData {
  email: string
  name?: string
  accessToken: string
  refreshToken?: string
  scope?: string
}

export interface UpdateGmailAccountData {
  name?: string
  isActive?: boolean
}

export function useGmailAccounts() {
  const { data: session, status } = useSession()

  return useQuery({
    queryKey: queryKeys.gmailAccounts.list(),
    queryFn: async () => {
      const response = await api.get<GmailAccount[]>('/gmail-accounts')
      return response.data.data
    },
    enabled: !!session?.user && status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

export function useGmailAccount(id: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: queryKeys.gmailAccounts.detail(id),
    queryFn: async () => {
      const response = await api.get<GmailAccount>(`/gmail-accounts/${id}`)
      return response.data.data
    },
    enabled: !!session?.user && !!id,
  })
}

export function useCreateGmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGmailAccountData) => {
      const response = await api.post<GmailAccount>('/gmail-accounts', data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.all })
      toast.success(`Gmail account "${data.email}" connected successfully`)
    },
  })
}

export function useUpdateGmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGmailAccountData }) => {
      const response = await api.put<GmailAccount>(`/gmail-accounts/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.detail(data.id) })
      toast.success('Gmail account updated successfully')
    },
  })
}

export function useDeleteGmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gmail-accounts/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.all })
      queryClient.removeQueries({ queryKey: queryKeys.gmailAccounts.detail(id) })
      toast.success('Gmail account disconnected successfully')
    },
  })
}

export function useSyncGmailAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/gmail-accounts/${id}/sync`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.emails.all })
      toast.success('Gmail sync started successfully')
    },
  })
}
