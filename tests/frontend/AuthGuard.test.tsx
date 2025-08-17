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
  Skeleton: ({ className, ...props }: any) => (
    <div className={className} data-testid="skeleton" {...props} />
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

  it('has correct loading skeleton structure', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    const { container } = render(<AuthGuard>{mockChildren}</AuthGuard>)

    const loadingContainer = container.querySelector('.min-h-screen.flex.items-center.justify-center')
    expect(loadingContainer).toBeInTheDocument()
    
    const skeletonContainer = container.querySelector('.space-y-4.w-full.max-w-md')
    expect(skeletonContainer).toBeInTheDocument()
    
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(3)
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

  it('renders multiple children correctly when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com'
        }
      },
      status: 'authenticated'
    })

    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    )

    render(<AuthGuard>{multipleChildren}</AuthGuard>)

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
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

  it('preserves children props and structure when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' }
      },
      status: 'authenticated'
    })

    const childrenWithProps = (
      <div data-testid="child-with-props" className="test-class" id="test-id">
        <span>Nested content</span>
      </div>
    )

    render(<AuthGuard>{childrenWithProps}</AuthGuard>)

    const childElement = screen.getByTestId('child-with-props')
    expect(childElement).toBeInTheDocument()
    expect(childElement).toHaveClass('test-class')
    expect(childElement).toHaveAttribute('id', 'test-id')
    expect(screen.getByText('Nested content')).toBeInTheDocument()
  })

  it('has correct accessibility structure in loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    const { container } = render(<AuthGuard>{mockChildren}</AuthGuard>)

    const loadingContainer = container.querySelector('.min-h-screen')
    expect(loadingContainer).toBeInTheDocument()
    
    expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center')
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
