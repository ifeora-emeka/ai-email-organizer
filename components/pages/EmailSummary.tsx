'use client'

import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ArrowLeft, Calendar, Mail, Paperclip, Star, Archive, Trash2, ExternalLink } from 'lucide-react'
import { useUnsubscribe, useUnsubscribeStatus } from '@/lib/hooks/use-unsubscribe'

interface EmailSummaryProps {
  email: {
    id: string
    subject: string
    fromEmail: string
    fromName: string
    toEmails: string
    receivedAt: string
    aiSummary: string
    body: string
    hasAttachments: boolean
    isRead: boolean
    category: string
    aiConfidence: number
    unsubscribeLink?: string
  }
  onBack: () => void
}

export default function EmailSummary({ email, onBack }: EmailSummaryProps) {
  const { unsubscribe } = useUnsubscribe();
  const { data: unsubscribeStatus } = useUnsubscribeStatus(email.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleUnsubscribe = async () => {
    if (email.unsubscribeLink) {
      try {
        await unsubscribe.mutateAsync({ emailId: email.id });
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Emails
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{email.category}</Badge>
          <Badge
            variant="secondary"
            className={`text-white ${getConfidenceColor(email.aiConfidence)}`}
          >
            {Math.round(email.aiConfidence * 100)}% confidence
          </Badge>
          {!email.isRead && <Badge variant="default">Unread</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl leading-tight">{email.subject}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">{email.fromName}</span>
                  <span>&lt;{email.fromEmail}&gt;</span>
                </div>
                {email.hasAttachments && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-4 w-4" />
                    <span>Has attachments</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(email.receivedAt)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">To:</span> {email.toEmails}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{email.aiSummary}</p>
            {email.unsubscribeLink && (
              <div className="mt-4 p-3 bg-accent rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Unsubscribe Link Found</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                    disabled={unsubscribe.isPending}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {unsubscribe.isPending ? 'Unsubscribing...' : 'Unsubscribe'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Archive className="h-4 w-4 mr-2" />
              Archive Email
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Email
            </Button>
            {email.unsubscribeLink && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleUnsubscribe}
                disabled={unsubscribe.isPending}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {unsubscribe.isPending ? 'Unsubscribing...' : 'Auto Unsubscribe'}
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Mark as {email.isRead ? 'Unread' : 'Read'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {unsubscribeStatus?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unsubscribe Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={unsubscribeStatus.data.status === 'completed' ? 'default' : 'secondary'}>
                {unsubscribeStatus.data.status}
              </Badge>
            </div>
            {unsubscribeStatus.data.successMessage && (
              <p className="text-sm text-muted-foreground mt-2">
                {unsubscribeStatus.data.successMessage}
              </p>
            )}
            {unsubscribeStatus.data.errorMessage && (
              <p className="text-sm text-destructive mt-2">
                Error: {unsubscribeStatus.data.errorMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Original Email Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {email.body}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
