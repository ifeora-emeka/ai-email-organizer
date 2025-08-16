import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MailOpen, 
  Mail, 
  Archive, 
  Paperclip, 
  Clock,
  User
} from 'lucide-react'
import { Email } from '@/lib/hooks'
import { cn } from '@/lib/utils'

interface EmailItemProps {
  email: Email
  onMarkAsRead?: (id: string, isRead: boolean) => void
  onArchive?: (id: string, isArchived: boolean) => void
  onCategorize?: (id: string, categoryId: string | null) => void
}

export function EmailItem({ 
  email, 
  onMarkAsRead, 
  onArchive, 
  onCategorize 
}: EmailItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 168) { 
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={cn(
      "w-full transition-all duration-200 hover:shadow-md cursor-pointer",
      !email.isRead && "border-l-4 border-l-blue-500 bg-blue-50/30"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {email.subject || '(No Subject)'}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{email.fromName}</span>
              <span className="text-xs">•</span>
              <span className="truncate text-xs">{email.fromEmail}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={getPriorityColor(email.priority)}
            >
              {email.priority}
            </Badge>
            {!email.isRead && (
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {email.aiSummary || email.body.substring(0, 150) + '...'}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                {email.category}
              </Badge>
              {email.hasAttachments && (
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs">Attachments</span>
                </div>
              )}
              {email.aiConfidence > 0 && (
                <div className="text-xs text-muted-foreground">
                  AI: {Math.round(email.aiConfidence * 100)}%
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {formatDate(email.receivedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead?.(email.id, !email.isRead)
              }}
              className="h-8 px-2"
            >
              {email.isRead ? (
                <Mail className="h-4 w-4" />
              ) : (
                <MailOpen className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {email.isRead ? 'Unread' : 'Read'}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onArchive?.(email.id, !email.isArchived)
              }}
              className="h-8 px-2"
            >
              <Archive className="h-4 w-4" />
              <span className="ml-1 text-xs">
                {email.isArchived ? 'Unarchive' : 'Archive'}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmailItem