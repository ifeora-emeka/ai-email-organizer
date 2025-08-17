import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import EachEmail from '@/components/EachEmail'

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  ),
}))

jest.mock('lucide-react', () => ({
  Clock: ({ ...props }: any) => (
    <div {...props} data-testid="clock-icon" />
  ),
  Paperclip: ({ ...props }: any) => (
    <div {...props} data-testid="paperclip-icon" />
  ),
  UserIcon: ({ ...props }: any) => (
    <div {...props} data-testid="user-icon" />
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

    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnClick).not.toHaveBeenCalled()
  })
})
