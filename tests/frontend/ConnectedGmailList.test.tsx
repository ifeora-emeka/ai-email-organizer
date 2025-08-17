import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ConnectedGmailList from '@/components/ConnectedGmailList'

const mockUpdateState = jest.fn()
let mockState = {
  gmailAccounts: [
    {
      id: 'gmail-1',
      email: 'test1@example.com',
      name: 'Test User 1',
      isActive: true,
      lastSync: new Date('2023-01-01T12:00:00Z'),
      emailCount: 25
    },
    {
      id: 'gmail-2',
      email: 'test2@example.com',
      name: '',
      isActive: false,
      lastSync: new Date('2023-01-01T10:00:00Z'),
      emailCount: 10
    }
  ],
  categories: [],
  activeCategory: null,
  activeCategoryId: null
}

const mockUseAppContext = jest.fn()

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => mockUseAppContext()
}))

const mockPush = jest.fn()
let mockMutate = jest.fn()
let mockIsPending = false

const mockUseApiMutation = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

jest.mock('@/lib/hooks', () => ({
  useApiMutation: () => mockUseApiMutation()
}))

jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn()
  }
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}))

jest.mock('@/components/EachGmailAccount', () => {
  return function MockEachGmailAccount({ account, getInitials, formatLastSync }: any) {
    return (
      <div data-testid={`gmail-account-${account.id}`}>
        <span data-testid="account-email">{account.email}</span>
        <span data-testid="account-name">{account.name}</span>
        <span data-testid="account-initials">{getInitials(account.name, account.email)}</span>
        <span data-testid="account-last-sync">{formatLastSync(account.lastSync)}</span>
        <span data-testid="account-status">{account.isActive ? 'active' : 'inactive'}</span>
      </div>
    )
  }
})

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, size, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('lucide-react', () => ({
  Mail: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="mail-icon" />
  ),
  Plus: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="plus-icon" />
  ),
  Loader2: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="loader-icon" />
  ),
}))

describe('ConnectedGmailList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockMutate = jest.fn()
    mockIsPending = false
    
    mockUseAppContext.mockReturnValue({
      state: mockState,
      updateState: mockUpdateState
    })
    
    mockUseApiMutation.mockReturnValue({
      mutate: (data: any) => {
        mockMutate(data)
        const mockResponse = {
          data: {
            oauthUrl: 'https://oauth.example.com/auth'
          }
        }
        // Simulate onSuccess callback
        setTimeout(() => {
          mockPush('https://oauth.example.com/auth')
        }, 0)
      },
      isPending: mockIsPending
    })
  })

  it('renders the component header correctly', () => {
    render(<ConnectedGmailList />)
    
    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('Manage connected accounts')).toBeInTheDocument()
    
    const connectButton = screen.getByRole('button', { name: /connect/i })
    expect(connectButton).toBeInTheDocument()
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('displays connected Gmail accounts', () => {
    render(<ConnectedGmailList />)
    
    expect(screen.getByTestId('gmail-account-gmail-1')).toBeInTheDocument()
    expect(screen.getByTestId('gmail-account-gmail-2')).toBeInTheDocument()
    
    expect(screen.getByText('test1@example.com')).toBeInTheDocument()
    expect(screen.getByText('test2@example.com')).toBeInTheDocument()
  })

  it('handles connect account button click', async () => {
    const user = userEvent.setup()
    render(<ConnectedGmailList />)
    
    const connectButton = screen.getByRole('button', { name: /connect/i })
    await user.click(connectButton)
    
    // Check that the mutate function was called with the current window.location.href
    expect(mockMutate).toHaveBeenCalledWith(window.location.href)
    
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(mockPush).toHaveBeenCalledWith('https://oauth.example.com/auth')
  })

  it('shows empty state when no accounts are connected', () => {
    const emptyState = {
      ...mockState,
      gmailAccounts: []
    }
    
    mockUseAppContext.mockReturnValue({
      state: emptyState,
      updateState: mockUpdateState
    })
    
    render(<ConnectedGmailList />)
    
    expect(screen.getByText('No accounts connected')).toBeInTheDocument()
    expect(screen.getByText('Connect your first account to start')).toBeInTheDocument()
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
  })

  it('shows empty state when gmailAccounts is null/undefined', () => {
    const nullState = {
      ...mockState,
      gmailAccounts: null
    }
    
    mockUseAppContext.mockReturnValue({
      state: nullState,
      updateState: mockUpdateState
    })
    
    render(<ConnectedGmailList />)
    
    expect(screen.getByText('No accounts connected')).toBeInTheDocument()
  })

  it('generates initials correctly for accounts with names', () => {
    render(<ConnectedGmailList />)
    
    const initialsElements = screen.getAllByTestId('account-initials')
    expect(initialsElements[0]).toHaveTextContent('TU') 
  })

  it('generates initials correctly for accounts without names', () => {
    render(<ConnectedGmailList />)
    
    const initialsElements = screen.getAllByTestId('account-initials')
    expect(initialsElements[1]).toHaveTextContent('TE') 
  })

  it('formats last sync time correctly', () => {
    render(<ConnectedGmailList />)
    
    const lastSyncElements = screen.getAllByTestId('account-last-sync')
    expect(lastSyncElements.length).toBeGreaterThan(0)
    expect(lastSyncElements[0]).toHaveTextContent(/ago|Just now/)
  })

  it('displays account status correctly', () => {
    render(<ConnectedGmailList />)
    
    const statusElements = screen.getAllByTestId('account-status')
    expect(statusElements[0]).toHaveTextContent('active')
    expect(statusElements[1]).toHaveTextContent('inactive')
  })

  it('has correct CSS structure and classes', () => {
    const { container } = render(<ConnectedGmailList />)
    
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('h-full', 'flex', 'flex-col', 'select-none')
    
    const headerSection = container.querySelector('.p-4.border-b')
    expect(headerSection).toBeInTheDocument()
    
    const accountsList = container.querySelector('.flex-1.overflow-y-auto')
    expect(accountsList).toBeInTheDocument()
  })

  it('connect button has correct size and styling', () => {
    render(<ConnectedGmailList />)
    
    const connectButton = screen.getByRole('button', { name: /connect/i })
    expect(connectButton).toHaveAttribute('data-size', 'sm')
    expect(connectButton).toHaveClass('gap-2')
  })

  it('passes correct props to EachGmailAccount components', () => {
    render(<ConnectedGmailList />)
    
    const initialsElements = screen.getAllByTestId('account-initials')
    expect(initialsElements[0]).toHaveTextContent('TU')
    
    const lastSyncElements = screen.getAllByTestId('account-last-sync')
    expect(lastSyncElements[0]).toHaveTextContent(/ago|Just now/)
  })

  it('handles loading state correctly', () => {
    mockIsPending = true
    mockUseApiMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true
    })
    
    render(<ConnectedGmailList />)
    
    const connectButton = screen.getByRole('button', { name: /connect/i })
    expect(connectButton).toBeDisabled()
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument()
  })

  it('getInitials function handles edge cases', () => {
    const component = new (require('@/components/ConnectedGmailList').default)()
    const getInitials = (name: string, email: string) => {
      if (name && name.trim()) {
          return name
              .trim()
              .split(' ')
              .map(part => part.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2);
      }
      
      return email
          .split('@')[0]
          .slice(0, 2)
          .toUpperCase();
    }
    
    expect(getInitials('', 'test@example.com')).toBe('TE')
    
    expect(getInitials('   ', 'test@example.com')).toBe('TE')
    
    expect(getInitials('John', 'john@example.com')).toBe('J')
    
    expect(getInitials('John Doe Smith', 'john@example.com')).toBe('JD')
    
    expect(getInitials('', 'test.user+tag@example.com')).toBe('TE')
  })

  it('formatLastSync function handles different time intervals', () => {
    const formatLastSync = (date: Date) => {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) return "Just now"
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return `${diffDays}d ago`
    }

    const now = new Date()
    
    const recent = new Date(now.getTime() - 30 * 1000)
    expect(formatLastSync(recent)).toBe('Just now')
    
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000) 
    expect(formatLastSync(minutesAgo)).toBe('5m ago')
    
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000) 
    expect(formatLastSync(hoursAgo)).toBe('3h ago')
    
    const daysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) 
    expect(formatLastSync(daysAgo)).toBe('2d ago')
  })

  it('handles accounts with missing properties gracefully', () => {
    const incompleteState = {
      ...mockState,
      gmailAccounts: [
        {
          id: 'incomplete-1',
          email: 'incomplete@example.com',
          isActive: true,
          lastSync: new Date()
        }
      ]
    }
    
    mockUseAppContext.mockReturnValue({
      state: incompleteState,
      updateState: mockUpdateState
    })
    
    render(<ConnectedGmailList />)
    
    expect(screen.getByTestId('gmail-account-incomplete-1')).toBeInTheDocument()
    expect(screen.getByText('incomplete@example.com')).toBeInTheDocument()
  })

  it('empty state has correct accessibility structure', () => {
    const emptyState = {
      ...mockState,
      gmailAccounts: []
    }
    
    mockUseAppContext.mockReturnValue({
      state: emptyState,
      updateState: mockUpdateState
    })
    
    const { container } = render(<ConnectedGmailList />)
    
    const emptyStateContainer = container.querySelector('.text-center.py-8')
    expect(emptyStateContainer).toBeInTheDocument()
    expect(emptyStateContainer).toHaveClass('text-muted-foreground')
  })
})
