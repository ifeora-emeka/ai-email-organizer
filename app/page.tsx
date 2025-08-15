
"use client"

import { Button } from "@/components/ui/button"
import { Mail, Plus, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useGmailAccounts, useDeleteGmailAccount, useGmailOAuth } from "@/lib/hooks"
import { toast } from "sonner"

export default function HomePage() {
  const { data: accounts = [], isLoading } = useGmailAccounts()
  const deleteGmailAccount = useDeleteGmailAccount()
  const { initiateOAuth } = useGmailOAuth()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const gmailConnected = searchParams.get('gmail_connected')
    const error = searchParams.get('error')

    if (gmailConnected === 'true') {
      toast.success('Gmail account connected successfully!')
      router.replace('/')
    } else if (error) {
      let message = 'Failed to connect Gmail account'
      switch (error) {
        case 'unauthorized':
          message = 'You must be logged in to connect Gmail'
          break
        case 'oauth_failed':
          message = 'Gmail connection failed. Please try again.'
          break
        case 'missing_code':
          message = 'Gmail authorization was incomplete'
          break
        default:
          message = `Connection error: ${error}`
      }
      toast.error(message)
      router.replace('/')
    }
  }, [searchParams, router])

  const handleDelete = async (accountId: string) => {
    try {
      await deleteGmailAccount.mutateAsync(accountId)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const handleAccountClick = (accountId: string) => {
    router.push(`/${accountId}`)
  }

  const handleConnectGmail = () => {
    initiateOAuth()
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email Organizer</h1>
          <p className="text-muted-foreground">Loading your Gmail accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Email Organizer</h1>
        <p className="text-muted-foreground">
          Manage your Gmail accounts and organize emails with AI
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connected Gmail Accounts
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your connected Gmail accounts
            </p>
          </div>
          <Button onClick={handleConnectGmail} className="gap-2">
            <Plus className="h-4 w-4" />
            Connect Gmail
          </Button>
        </div>

        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleAccountClick(account.id)}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.name || account.email}</span>
                      {account.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {new Date(account.lastSync || account.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {deleteConfirm === account.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Delete account?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteGmailAccount.isPending}
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(account.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Gmail accounts connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your first Gmail account to start organizing emails
            </p>
            <Button onClick={handleConnectGmail} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Connect Gmail
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
