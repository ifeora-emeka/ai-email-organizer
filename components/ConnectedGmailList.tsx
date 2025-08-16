'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, Mail, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface GmailAccount {
  id: string
  email: string
  name: string
  isActive: boolean
  lastSync: Date
  emailCount: number
}

const mockGmailAccounts: GmailAccount[] = [
  {
    id: '1',
    email: 'john.doe@gmail.com',
    name: 'John Doe',
    isActive: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    emailCount: 145
  },
  {
    id: '2',
    email: 'jane.smith@gmail.com',
    name: 'Jane Smith',
    isActive: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    emailCount: 89
  },
  {
    id: '3',
    email: 'work.account@company.com',
    name: 'Work Account',
    isActive: false,
    lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    emailCount: 267
  }
]

export default function ConnectedGmailList() {
  const [accounts, setAccounts] = useState<GmailAccount[]>(mockGmailAccounts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAccount, setNewAccount] = useState({
    email: '',
    name: ''
  })

  const handleConnectAccount = () => {
    if (newAccount.email.trim()) {
      const newGmailAccount: GmailAccount = {
        id: String(accounts.length + 1),
        email: newAccount.email.trim(),
        name: newAccount.name.trim() || newAccount.email.split('@')[0],
        isActive: true,
        lastSync: new Date(),
        emailCount: 0
      }
      setAccounts([...accounts, newGmailAccount])
      setNewAccount({ email: '', name: '' })
      setIsDialogOpen(false)
    }
  }

  const toggleAccountStatus = (id: string) => {
    setAccounts(accounts.map(account => 
      account.id === id 
        ? { ...account, isActive: !account.isActive }
        : account
    ))
  }

  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusIcon = (account: GmailAccount) => {
    if (!account.isActive) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
    
    const timeSinceSync = new Date().getTime() - account.lastSync.getTime()
    const hoursAgo = timeSinceSync / (1000 * 60 * 60)
    
    if (hoursAgo < 1) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Connected Gmail</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connect Gmail Account</DialogTitle>
                <DialogDescription>
                  Add another Gmail account to organize emails across multiple inboxes.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@gmail.com"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="My Work Account"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConnectAccount}
                  disabled={!newAccount.email.trim()}
                >
                  Connect Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage connected accounts
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(account)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate text-sm">{account.name}</p>
                    <Badge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {account.emailCount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatLastSync(account.lastSync)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAccountStatus(account.id)}
                className="text-xs"
              >
                {account.isActive ? 'Disable' : 'Enable'}
              </Button>
            </div>
          ))}
          
          {accounts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">No accounts connected</p>
              <p className="text-xs">Connect your first account to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}