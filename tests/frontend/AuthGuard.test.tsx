import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuthGuard from '@/components/AuthGuard'

jest.mock('@/components/Login', () => {
  return function MockLogin() {
    return <div data-testid="login-component">Login Component</div>
  }
})

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ ...props }: any) => (
    <div data-testid="skeleton" {...props} />
  ),
}))

const mockUseSession = jest.fn()
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession()
}))

describe('AuthGuard', () => {
  const mockChildren = <div data-testid="protected-content">Protected Content</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading skeleton when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument()
  })

  it('renders Login component when user is unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  })

  it('renders Login component when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'authenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated with valid session', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        accessToken: 'mock-token'
      },
      status: 'authenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  })

  it('handles session status changes correctly', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    const { rerender } = render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    rerender(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com'
        }
      },
      status: 'authenticated'
    })

    rerender(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument()
  })

  it('handles different session data structures', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'minimal@example.com'
        }
      },
      status: 'authenticated'
    })

    const { unmount } = render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    unmount()

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '123',
          email: 'complete@example.com',
          name: 'Complete User',
          image: 'https://example.com/avatar.jpg'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expires: '2024-12-31'
      },
      status: 'authenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('handles edge case of undefined session data', () => {
    mockUseSession.mockReturnValue({
      data: undefined,
      status: 'authenticated'
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('handles unknown session status gracefully', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unknown' as any
    })

    render(<AuthGuard>{mockChildren}</AuthGuard>)

    expect(screen.getByTestId('login-component')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
