import React, { useState } from 'react'
import { useEmails, useMarkEmailAsRead, useArchiveEmail, Email } from '@/lib/hooks'
import EmailItem from './EmailItem'
import EmailListSkeleton from './EmailListSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Inbox, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

interface EmailListProps {
  categoryId?: string | null
  categoryName?: string
  className?: string
}

export function EmailList({ categoryId, categoryName, className }: EmailListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'receivedAt' | 'subject' | 'fromEmail'>('receivedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const pageSize = 20

  const queryClient = useQueryClient()

  const emailQuery = {
    categoryId: categoryId || undefined,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    isArchived: showArchived
  }

  const { 
    data: emailsResponse, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching
  } = useEmails(emailQuery)

  const markAsReadMutation = useMarkEmailAsRead()
  const archiveMutation = useArchiveEmail()

  const handleMarkAsRead = async (emailId: string, isRead: boolean) => {
    try {
      await markAsReadMutation.mutateAsync({ id: emailId, isRead })
      
      queryClient.invalidateQueries({ queryKey: [...queryKeys.emails.all] })
      toast.success(isRead ? 'Email marked as read' : 'Email marked as unread')
    } catch (error) {
      toast.error('Failed to update email status')
      console.error('Mark as read error:', error)
    }
  }

  const handleArchive = async (emailId: string, isArchived: boolean) => {
    try {
      await archiveMutation.mutateAsync({ id: emailId, isArchived })
      
      queryClient.invalidateQueries({ queryKey: [...queryKeys.emails.all] })
      toast.success(isArchived ? 'Email archived' : 'Email unarchived')
    } catch (error) {
      toast.error('Failed to archive email')
      console.error('Archive error:', error)
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const emails = emailsResponse?.data || []
  const pagination = emailsResponse?.pagination

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load emails: {error?.message || 'Unknown error'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Inbox className="h-5 w-5" />
                <span>
                  {categoryName || 'Emails'}
                </span>
                {pagination && (
                  <Badge variant="secondary">
                    {pagination.total} emails
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) 
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receivedAt">Date</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="fromEmail">Sender</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showArchived ? 'Archived' : 'Active'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <EmailListSkeleton />
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm ? 'No emails found' : 'No emails in this category'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Emails will appear here when they are categorized'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {emails.map((email) => (
                  <EmailItem
                    key={email.id}
                    email={email}
                    onMarkAsRead={handleMarkAsRead}
                    onArchive={handleArchive}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} emails
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailList