"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Paperclip, ArrowLeft, Star, Archive, Trash2 } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'

interface MockEmail {
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

const mockEmails: MockEmail[] = [
  {
    id: '1',
    subject: 'Welcome to your new AI-powered email organizer!',
    fromEmail: 'no-reply@email-organizer.com',
    fromName: 'AI Email Organizer',
    receivedAt: '2025-08-16T10:30:00Z',
    aiSummary: 'Welcome email introducing the AI email organizer features and capabilities. Contains getting started guide and feature overview.',
    body: `Dear User,

Welcome to AI Email Organizer! We're excited to help you take control of your inbox with the power of artificial intelligence.

Here's what you can do with our platform:
- Automatically categorize emails using AI
- Get smart summaries of your emails
- Bulk actions to manage your inbox efficiently
- One-click unsubscribe from unwanted emails

Getting started is easy:
1. Connect your Gmail accounts
2. Create custom categories
3. Let our AI organize your emails automatically

Best regards,
The AI Email Organizer Team`,
    hasAttachments: false,
    isRead: false,
    category: 'Personal',
    aiConfidence: 0.95,
    priority: 'medium'
  },
  {
    id: '2',
    subject: 'Your Weekly Newsletter - Tech Updates',
    fromEmail: 'newsletter@techblog.com',
    fromName: 'TechBlog Weekly',
    receivedAt: '2025-08-16T09:15:00Z',
    aiSummary: 'Weekly tech newsletter covering AI advancements, new programming frameworks, and industry news. Highlights include GPT-5 announcement and quantum computing breakthrough.',
    body: `This week in tech:

🤖 AI & Machine Learning
- GPT-5 officially announced by OpenAI
- New breakthrough in quantum computing by IBM
- AI chip shortage expected to continue through 2025

💻 Development
- React 19 beta now available
- New Python 3.12 features overview
- Node.js security update released

📱 Mobile
- iOS 18 developer preview
- Android 15 beta features
- Flutter 4.0 roadmap announced

Stay updated with the latest in technology!`,
    hasAttachments: true,
    isRead: true,
    category: 'News',
    aiConfidence: 0.88,
    priority: 'low'
  },
  {
    id: '3',
    subject: 'Project Deadline Reminder - Q3 Reports',
    fromEmail: 'jane.manager@company.com',
    fromName: 'Jane Manager',
    receivedAt: '2025-08-16T08:45:00Z',
    aiSummary: 'Urgent reminder about Q3 report deadline approaching on Friday. Requests status update and offers support for completion.',
    body: `Hi John,

This is a friendly reminder that the Q3 reports are due this Friday, August 18th.

Please ensure you have:
- Completed all data analysis
- Prepared the executive summary
- Reviewed the financial projections
- Submitted for peer review

If you need any assistance or have questions, please don't hesitate to reach out.

Best regards,
Jane`,
    hasAttachments: false,
    isRead: false,
    category: 'Work',
    aiConfidence: 0.92,
    priority: 'high'
  },
  {
    id: '4',
    subject: 'Flash Sale: 50% Off All Items - Limited Time!',
    fromEmail: 'sales@onlinestore.com',
    fromName: 'Online Store',
    receivedAt: '2025-08-16T07:20:00Z',
    aiSummary: 'Promotional email advertising a 50% off flash sale on all items. Sale ends in 24 hours with free shipping on orders over $50.',
    body: `🎉 FLASH SALE ALERT! 🎉

50% OFF EVERYTHING!
Limited time offer - Sale ends in 24 hours!

✨ FREE SHIPPING on orders over $50
🚀 Express delivery available
💳 Easy returns within 30 days

Use code: FLASH50

Shop now before it's too late!
[Shop Now Button]

This email was sent to john.doe@gmail.com
To unsubscribe, click here.`,
    hasAttachments: false,
    isRead: true,
    category: 'Shopping',
    aiConfidence: 0.97,
    priority: 'low'
  },
  {
    id: '5',
    subject: 'Security Alert: New Device Login Detected',
    fromEmail: 'security@gmail.com',
    fromName: 'Gmail Security',
    receivedAt: '2025-08-16T06:10:00Z',
    aiSummary: 'Security notification about new device login from Windows computer in New York. No action required if this was you, otherwise secure account immediately.',
    body: `Security Alert

We detected a new sign-in to your Google Account.

Device: Windows Computer
Location: New York, NY, USA
Time: August 16, 2025 at 6:10 AM EDT

If this was you, you can ignore this alert. If not, we recommend:
- Changing your password immediately
- Reviewing your account activity
- Enabling 2-factor authentication

Review Activity: [Link]
Secure Account: [Link]

Google Security Team`,
    hasAttachments: false,
    isRead: false,
    category: 'Security',
    aiConfidence: 0.99,
    priority: 'high'
  }
]

export default function HomePage() {
  const { data: session } = useSession()
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null)

  const handleEmailClick = (email: MockEmail) => {
    setSelectedEmail(email)
  }

  const handleBackToList = () => {
    setSelectedEmail(null)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'low': return 'bg-green-500/10 text-green-700 border-green-500/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Personal': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Work': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      'News': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      'Shopping': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
      'Security': 'bg-destructive/10 text-destructive border-destructive/20'
    }
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground border-border'
  }

  // Email detail view
  if (selectedEmail) {
    return (
      <AuthGuard>
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-border/50">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBackToList}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to emails
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-foreground mb-3">
                      {selectedEmail.subject}
                    </h1>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium text-foreground">
                        {selectedEmail.fromName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        &lt;{selectedEmail.fromEmail}&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeAgo(selectedEmail.receivedAt)}</span>
                      {selectedEmail.hasAttachments && (
                        <>
                          <span>•</span>
                          <Paperclip className="h-4 w-4" />
                          <span>Has attachments</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <Badge className={`text-xs px-2 py-1 ${getCategoryColor(selectedEmail.category)}`}>
                    {selectedEmail.category}
                  </Badge>
                  <Badge className={`text-xs px-2 py-1 ${getPriorityColor(selectedEmail.priority)}`}>
                    {selectedEmail.priority} priority
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    AI Confidence: {Math.round(selectedEmail.aiConfidence * 100)}%
                  </Badge>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-primary mb-2">AI Summary</h3>
                  <p className="text-sm text-primary/80">{selectedEmail.aiSummary}</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Email list view
  return (
    <AuthGuard>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-border/50">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Inbox</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-border/50">
            {mockEmails.map((email) => (
              <div
                key={email.id}
                className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                  !email.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium text-foreground text-sm ${!email.isRead ? 'font-semibold' : ''}`}>
                        {email.fromName}
                      </span>
                      <Badge className={`text-xs px-2 py-1 ${getCategoryColor(email.category)}`}>
                        {email.category}
                      </Badge>
                      <Badge className={`text-xs px-2 py-1 ${getPriorityColor(email.priority)}`}>
                        {email.priority}
                      </Badge>
                    </div>
                    
                    <h3 className={`text-sm text-foreground mb-2 ${!email.isRead ? 'font-semibold' : ''}`}>
                      {email.subject}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {email.aiSummary}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(email.receivedAt)}</span>
                      </div>
                      {email.hasAttachments && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>Attachment</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>AI: {Math.round(email.aiConfidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!email.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
