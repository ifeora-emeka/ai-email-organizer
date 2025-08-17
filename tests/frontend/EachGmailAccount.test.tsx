import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import EachGmailAccount from '@/components/EachGmailAccount'

// Mock the UI components
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  AvatarFallback: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Mail: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="mail-icon" />
  ),
}))

describe('EachGmailAccount', () => {
  const mockGetInitials = jest.fn()
  const mockFormatLastSync = jest.fn()

  const mockAccount = {
    id: 'test-account-1',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    lastSync: new Date('2023-01-01T12:00:00Z'),
    emailCount: 42,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetInitials.mockReturnValue('TU')
    mockFormatLastSync.mockReturnValue('2h ago')
  })

  it('renders gmail account information correctly', () => {
    render(
      <EachGmailAccount
        account={mockAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(screen.getByTestId('gmail-account-test-account-1')).toBeInTheDocument()
    
    expect(screen.getByTestId('gmail-account-name')).toHaveTextContent('Test User')
    
    expect(screen.getByTestId('gmail-account-email')).toHaveTextContent('test@example.com')
    
    expect(screen.getByTestId('gmail-account-email-count')).toHaveTextContent('42')
    
    expect(screen.getByTestId('gmail-account-last-sync')).toHaveTextContent('2h ago')
  })

  it('displays initials correctly in avatar', () => {
    render(
      <EachGmailAccount
        account={mockAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(mockGetInitials).toHaveBeenCalledWith('Test User', 'test@example.com')
    
    expect(screen.getByTestId('gmail-account-initials')).toHaveTextContent('TU')
  })

  it('handles account without name correctly', () => {
    const accountWithoutName = {
      ...mockAccount,
      name: undefined,
    }

    render(
      <EachGmailAccount
        account={accountWithoutName}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(mockGetInitials).toHaveBeenCalledWith('', 'test@example.com')
    
    expect(screen.getByTestId('gmail-account-name')).toBeEmptyDOMElement()
  })

  it('handles account with empty name correctly', () => {
    const accountWithEmptyName = {
      ...mockAccount,
      name: '',
    }

    render(
      <EachGmailAccount
        account={accountWithEmptyName}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    // Check if getInitials is called with empty string for name
    expect(mockGetInitials).toHaveBeenCalledWith('', 'test@example.com')
    
    // Name field should be empty
    expect(screen.getByTestId('gmail-account-name')).toHaveTextContent('')
  })

  it('handles zero email count correctly', () => {
    const accountWithZeroEmails = {
      ...mockAccount,
      emailCount: 0,
    }

    render(
      <EachGmailAccount
        account={accountWithZeroEmails}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(screen.getByTestId('gmail-account-email-count')).toHaveTextContent('0')
  })

  it('handles undefined email count correctly', () => {
    const accountWithoutEmailCount = {
      ...mockAccount,
      emailCount: undefined,
    }

    render(
      <EachGmailAccount
        account={accountWithoutEmailCount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    // Should display empty or handle undefined gracefully
    const emailCountElement = screen.getByTestId('gmail-account-email-count')
    expect(emailCountElement).toBeInTheDocument()
  })

  it('calls formatLastSync with correct date', () => {
    const testDate = new Date('2023-06-15T10:30:00Z')
    const accountWithSpecificDate = {
      ...mockAccount,
      lastSync: testDate,
    }

    render(
      <EachGmailAccount
        account={accountWithSpecificDate}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(mockFormatLastSync).toHaveBeenCalledWith(testDate)
  })

  it('displays mail icon', () => {
    render(
      <EachGmailAccount
        account={mockAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
  })

  it('has correct CSS classes for styling', () => {
    render(
      <EachGmailAccount
        account={mockAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    const container = screen.getByTestId('gmail-account-test-account-1')
    expect(container).toHaveClass('flex', 'items-center', 'justify-between', 'p-3', 'bg-accent/30', 'rounded-lg', 'hover:bg-accent/50', 'transition-colors')
  })

  it('handles very long email addresses correctly', () => {
    const accountWithLongEmail = {
      ...mockAccount,
      email: 'very-long-email-address-that-might-overflow@very-long-domain-name-example.com',
    }

    render(
      <EachGmailAccount
        account={accountWithLongEmail}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    const emailElement = screen.getByTestId('gmail-account-email')
    expect(emailElement).toHaveClass('truncate')
    expect(emailElement).toHaveTextContent('very-long-email-address-that-might-overflow@very-long-domain-name-example.com')
  })

  it('handles very long names correctly', () => {
    const accountWithLongName = {
      ...mockAccount,
      name: 'Very Long Name That Should Be Truncated In The UI',
    }

    render(
      <EachGmailAccount
        account={accountWithLongName}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    const nameElement = screen.getByTestId('gmail-account-name')
    expect(nameElement).toHaveClass('truncate')
    expect(nameElement).toHaveTextContent('Very Long Name That Should Be Truncated In The UI')
  })

  it('handles large email counts correctly', () => {
    const accountWithLargeEmailCount = {
      ...mockAccount,
      emailCount: 99999,
    }

    render(
      <EachGmailAccount
        account={accountWithLargeEmailCount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(screen.getByTestId('gmail-account-email-count')).toHaveTextContent('99999')
  })

  it('handles inactive account correctly', () => {
    const inactiveAccount = {
      ...mockAccount,
      isActive: false,
    }

    render(
      <EachGmailAccount
        account={inactiveAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    expect(screen.getByTestId('gmail-account-name')).toHaveTextContent('Test User')
    expect(screen.getByTestId('gmail-account-email')).toHaveTextContent('test@example.com')
  })

  it('maintains accessibility structure', () => {
    render(
      <EachGmailAccount
        account={mockAccount}
        getInitials={mockGetInitials}
        formatLastSync={mockFormatLastSync}
      />
    )

    const container = screen.getByTestId('gmail-account-test-account-1')
    expect(container).toBeInTheDocument()
    
    expect(screen.getByTestId('gmail-account-avatar')).toBeInTheDocument()
    expect(screen.getByTestId('gmail-account-initials')).toBeInTheDocument()
  })
})
