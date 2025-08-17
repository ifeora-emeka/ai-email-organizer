import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AppLayout from '@/components/layout/AppLayout'

jest.mock('@/components/CategoryList', () => {
  return function MockCategoryList() {
    return <div data-testid="category-list">CategoryList Component</div>
  }
})

jest.mock('@/components/ConnectedGmailList', () => {
  return function MockConnectedGmailList() {
    return <div data-testid="connected-gmail-list">ConnectedGmailList Component</div>
  }
})

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ ...props }: any) => (
    <div data-testid="skeleton" {...props} />
  ),
}))

jest.mock('lucide-react', () => ({
  ArrowLeft: ({ ...props }: any) => (
    <div data-testid="arrow-left-icon" {...props} />
  ),
}))

describe('AppLayout', () => {
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <AppLayout onBack={mockOnBack}>
        <div>Content</div>
      </AppLayout>
    )

    const backButton = screen.getByRole('button')
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('displays loading skeleton when isLoading is true', () => {
    render(
      <AppLayout isLoading={true}>
        <div>Content</div>
      </AppLayout>
    )

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    
    expect(screen.queryByTestId('category-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('connected-gmail-list')).not.toBeInTheDocument()
  })

  it('handles loading state transitions correctly', () => {
    const { rerender } = render(
      <AppLayout isLoading={true}>
        <div data-testid="main-content">Content</div>
      </AppLayout>
    )

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('main-content')).not.toBeInTheDocument()

    rerender(
      <AppLayout isLoading={false}>
        <div data-testid="main-content">Content</div>
      </AppLayout>
    )

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })
})
