import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import EachGmailAccount from '@/components/EachGmailAccount'

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AvatarFallback: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}))

jest.mock('lucide-react', () => ({
  Mail: ({ ...props }: any) => (
    <div {...props} data-testid="mail-icon" />
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

    expect(mockGetInitials).toHaveBeenCalledWith('', 'test@example.com')
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
})
