export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface GmailAccount {
  id: string
  userId: string
  email: string
  name?: string
  isActive: boolean
  lastSync: Date
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  userId: string
  name: string
  description: string
  color: string
  emailCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Email {
  id: string
  gmailAccountId: string
  categoryId?: string
  messageId: string
  threadId?: string
  subject?: string
  fromEmail: string
  fromName?: string
  toEmails: string
  ccEmails?: string
  bccEmails?: string
  body?: string
  htmlBody?: string
  receivedAt: Date
  hasAttachments: boolean
  isRead: boolean
  isArchived: boolean
  aiSummary?: string
  aiCategory?: string
  aiConfidence?: number
  unsubscribeLink?: string
  createdAt: Date
  updatedAt: Date
}
