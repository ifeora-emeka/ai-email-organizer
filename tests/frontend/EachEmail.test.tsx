import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import EachEmail from '@/components/EachEmail'

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, className, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={className}
      {...props}
    />
  ),
}))

jest.mock('lucide-react', () => ({
  Clock: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="clock-icon" />
  ),
  Paperclip: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="paperclip-icon" />
  ),
  UserIcon: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="user-icon" />
  ),
}))

describe('EachEmail', () => {
  const mockOnSelect = jest.fn()
  const mockOnClick = jest.fn()
  const mockFormatTimeAgo = jest.fn()

  const mockEmail = {
    id: 'test-email-1',
    subject: 'Important Business Meeting',
    fromName: 'John Doe',
    fromEmail: 'john.doe@example.com',
    toEmails: ['recipient@example.com'],
    body: 'This is the email body content',
    aiSummary: 'Meeting scheduled for next week to discuss quarterly results',
    receivedAt: '2023-01-01T12:00:00Z',
    isRead: false,
    isArchived: false,
    hasAttachments: true,
    aiConfidence: 0.95,
    priority: 'high' as const,
    category: 'work',
    categoryId: 'category-work-1',
    gmailAccount: {
      id: 'gmail-1',
      name: 'Business Account',
      email: 'business@example.com'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormatTimeAgo.mockReturnValue('2h ago')
  })

  it('renders email information correctly', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-test-email-1')).toBeInTheDocument()
    
    expect(screen.getByTestId('email-subject')).toHaveTextContent('Important Business Meeting')
    
    expect(screen.getByTestId('email-from-name')).toHaveTextContent('John Doe')
    
    expect(screen.getByTestId('email-ai-summary')).toHaveTextContent('Meeting scheduled for next week to discuss quarterly results')
    
    expect(screen.getByTestId('email-ai-confidence')).toHaveTextContent('AI: 95%')
    
    expect(screen.getByTestId('email-gmail-account')).toHaveTextContent('Business Account')
  })

  it('displays unread state correctly', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-unread-indicator')).toBeInTheDocument()
    
    const container = screen.getByTestId('email-test-email-1')
    expect(container).toHaveClass('bg-primary/5', 'border-l-2', 'border-l-primary')
    
    const fromName = screen.getByTestId('email-from-name')
    expect(fromName).toHaveClass('font-semibold')
    
    const subject = screen.getByTestId('email-subject')
    expect(subject).toHaveClass('font-semibold')
  })

  it('displays read state correctly', () => {
    const readEmail = { ...mockEmail, isRead: true }
    
    render(
      <EachEmail
        email={readEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.queryByTestId('email-unread-indicator')).not.toBeInTheDocument()
    
    const container = screen.getByTestId('email-test-email-1')
    expect(container).not.toHaveClass('bg-primary/5', 'border-l-2', 'border-l-primary')
    
    const fromName = screen.getByTestId('email-from-name')
    expect(fromName).not.toHaveClass('font-semibold')
    
    const subject = screen.getByTestId('email-subject')
    expect(subject).not.toHaveClass('font-semibold')
  })

  it('displays selected state correctly', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={true}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const container = screen.getByTestId('email-test-email-1')
    expect(container).toHaveClass('bg-primary/10')
    
    const checkbox = screen.getByTestId('email-checkbox')
    expect(checkbox).toBeChecked()
  })

  it('handles checkbox selection correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const checkbox = screen.getByTestId('email-checkbox')
    await user.click(checkbox)

    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith('test-email-1', true)
  })

  it('handles email click correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const emailContent = screen.getByTestId('email-content')
    await user.click(emailContent)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith(mockEmail)
  })

  it('displays attachments indicator when email has attachments', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-attachments')).toBeInTheDocument()
    expect(screen.getByTestId('email-attachments')).toHaveTextContent('Attachment')
    expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument()
  })

  it('does not display attachments indicator when email has no attachments', () => {
    const emailWithoutAttachments = { ...mockEmail, hasAttachments: false }
    
    render(
      <EachEmail
        email={emailWithoutAttachments}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.queryByTestId('email-attachments')).not.toBeInTheDocument()
    expect(screen.queryByTestId('paperclip-icon')).not.toBeInTheDocument()
  })

  it('calls formatTimeAgo with correct parameter', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(mockFormatTimeAgo).toHaveBeenCalledWith('2023-01-01T12:00:00Z')
    expect(screen.getByTestId('email-time')).toHaveTextContent('2h ago')
  })

  it('displays AI confidence percentage correctly', () => {
    const emailWithDifferentConfidence = { ...mockEmail, aiConfidence: 0.78 }
    
    render(
      <EachEmail
        email={emailWithDifferentConfidence}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-ai-confidence')).toHaveTextContent('AI: 78%')
  })

  it('handles Gmail account with name correctly', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-gmail-account')).toHaveTextContent('Business Account')
  })

  it('handles Gmail account without name correctly', () => {
    const emailWithGmailAccountWithoutName = {
      ...mockEmail,
      gmailAccount: {
        id: 'gmail-1',
        email: 'business@example.com'
      }
    }
    
    render(
      <EachEmail
        email={emailWithGmailAccountWithoutName}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-gmail-account')).toHaveTextContent('business@example.com')
  })

  it('handles missing Gmail account correctly', () => {
    const emailWithoutGmailAccount = {
      ...mockEmail,
      gmailAccount: undefined
    }
    
    render(
      <EachEmail
        email={emailWithoutGmailAccount}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const gmailAccountElement = screen.getByTestId('email-gmail-account')
    expect(gmailAccountElement).toBeInTheDocument()
  })

  it('handles very long subjects correctly', () => {
    const emailWithLongSubject = {
      ...mockEmail,
      subject: 'This is a very long email subject that should be displayed properly without breaking the layout and maintaining readability'
    }
    
    render(
      <EachEmail
        email={emailWithLongSubject}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-subject')).toHaveTextContent('This is a very long email subject that should be displayed properly without breaking the layout and maintaining readability')
  })

  it('handles very long sender names correctly', () => {
    const emailWithLongSenderName = {
      ...mockEmail,
      fromName: 'Very Long Sender Name That Should Be Displayed Properly'
    }
    
    render(
      <EachEmail
        email={emailWithLongSenderName}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-from-name')).toHaveTextContent('Very Long Sender Name That Should Be Displayed Properly')
  })

  it('handles very long AI summary correctly', () => {
    const emailWithLongSummary = {
      ...mockEmail,
      aiSummary: 'This is a very long AI-generated summary that should be truncated using line-clamp-2 to prevent the email item from becoming too tall and maintaining consistent spacing in the email list'
    }
    
    render(
      <EachEmail
        email={emailWithLongSummary}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const summaryElement = screen.getByTestId('email-ai-summary')
    expect(summaryElement).toHaveClass('line-clamp-2')
    expect(summaryElement).toHaveTextContent('This is a very long AI-generated summary that should be truncated using line-clamp-2 to prevent the email item from becoming too tall and maintaining consistent spacing in the email list')
  })

  it('has correct accessibility attributes', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const emailContent = screen.getByTestId('email-content')
    expect(emailContent).toHaveAttribute('role', 'button')
  })

  it('displays all required icons', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument() // because hasAttachments is true
  })

  it('handles edge case of zero AI confidence', () => {
    const emailWithZeroConfidence = { ...mockEmail, aiConfidence: 0 }
    
    render(
      <EachEmail
        email={emailWithZeroConfidence}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-ai-confidence')).toHaveTextContent('AI: 0%')
  })

  it('handles edge case of maximum AI confidence', () => {
    const emailWithMaxConfidence = { ...mockEmail, aiConfidence: 1 }
    
    render(
      <EachEmail
        email={emailWithMaxConfidence}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    expect(screen.getByTestId('email-ai-confidence')).toHaveTextContent('AI: 100%')
  })

  it('handles checkbox deselection correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachEmail
        email={mockEmail}
        isSelected={true}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const checkbox = screen.getByTestId('email-checkbox')
    await user.click(checkbox)

    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith('test-email-1', false)
  })

  it('prevents email click when checkbox is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const checkbox = screen.getByTestId('email-checkbox')
    await user.click(checkbox)

    // Only onSelect should be called, not onClick
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('has correct CSS classes for styling', () => {
    render(
      <EachEmail
        email={mockEmail}
        isSelected={false}
        onSelect={mockOnSelect}
        onClick={mockOnClick}
        formatTimeAgo={mockFormatTimeAgo}
      />
    )

    const container = screen.getByTestId('email-test-email-1')
    expect(container).toHaveClass('p-4', 'hover:bg-accent/50', 'transition-colors')
  })
})
