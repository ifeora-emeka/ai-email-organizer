
"use client"

import { Button } from "@/components/ui/button"
import { Mail, Plus, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const mockConnectedAccounts = [
  {
    id: "1",
    email: "john.doe@gmail.com",
    name: "John Doe",
    isActive: true,
    lastSync: "2 minutes ago",
    unreadCount: 15
  },
  {
    id: "2",
    email: "jane.smith@gmail.com",
    name: "Jane Smith",
    isActive: true,
    lastSync: "5 minutes ago",
    unreadCount: 8
  }
]

export default function HomePage() {
  const [accounts, setAccounts] = useState(mockConnectedAccounts)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = (accountId: string) => {
    setAccounts(accounts.filter(account => account.id !== accountId))
    setDeleteConfirm(null)
  }

  const handleAccountClick = (accountId: string) => {
    router.push(`/${accountId}`)
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
          <Button className="gap-2">
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
                      <span className="font-medium">{account.name}</span>
                      {account.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {account.lastSync} • {account.unreadCount} unread
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
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Connect Gmail
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
