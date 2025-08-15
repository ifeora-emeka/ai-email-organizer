import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import { GmailOAuthService } from '@/lib/services/gmail-oauth.service'

export interface ConnectGmailData {
  email: string
  name?: string
  accessToken: string
  refreshToken?: string
  scope?: string
}

export function useConnectGmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ConnectGmailData) => {
      const response = await api.post('/gmail-accounts', data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailAccounts.all })
      toast.success(`Gmail account "${data.email}" connected successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to connect Gmail account'
      toast.error(message)
    },
  })
}

export function useGmailOAuth() {
  const gmailOAuthService = new GmailOAuthService()

  const initiateOAuth = () => {
    const authUrl = gmailOAuthService.getAuthUrl()
    window.location.href = authUrl
  }

  return {
    initiateOAuth,
    isConnecting: false, // OAuth redirect handles the connection
  }
}
