import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, size, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div className={className} data-testid="skeleton" {...props} />
  ),
}))

jest.mock('lucide-react', () => ({
  ArrowLeft: ({ className, ...props }: any) => (
    <div className={className} {...props} data-testid="arrow-left-icon" />
  ),
}))

describe('AppLayout', () => {
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main layout structure correctly', () => {
    render(
      <AppLayout>
        <div data-testid="main-content">Main Content</div>
      </AppLayout>
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
    
    expect(screen.getByTestId('category-list')).toBeInTheDocument()
    expect(screen.getByTestId('connected-gmail-list')).toBeInTheDocument()
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  it('displays default heading when no heading prop is provided', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByText('Email Organizer')).toBeInTheDocument()
  })

  it('displays custom heading when heading prop is provided', () => {
    render(
      <AppLayout heading="Custom Heading">
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByText('Custom Heading')).toBeInTheDocument()
  })

  it('shows back button when onBack prop is provided', () => {
    render(
      <AppLayout onBack={mockOnBack}>
        <div>Content</div>
      </AppLayout>
    )

    const backButton = screen.getByRole('button')
    expect(backButton).toBeInTheDocument()
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
  })

  it('does not show back button when onBack prop is not provided', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.queryByTestId('arrow-left-icon')).not.toBeInTheDocument()
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

  it('has correct layout grid structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    const gridContainer = container.querySelector('.grid.grid-cols-12')
    expect(gridContainer).toBeInTheDocument()
    
    const leftSidebar = container.querySelector('.col-span-3')
    const mainContent = container.querySelector('.col-span-6')
    const rightSidebar = container.querySelector('.col-span-3')
    
    expect(leftSidebar).toBeInTheDocument()
    expect(mainContent).toBeInTheDocument()
    expect(rightSidebar).toBeInTheDocument()
  })

  it('has correct CSS classes for styling', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('min-h-screen', 'w-full', 'bg-background', 'flex', 'items-center', 'justify-center', 'p-4')
  })

  it('renders header with correct structure', () => {
    render(
      <AppLayout heading="Test Heading" onBack={mockOnBack}>
        <div>Content</div>
      </AppLayout>
    )

    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('border-b', 'border-border', 'h-14')
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Test Heading')
  })

  it('main content area has correct overflow behavior', () => {
    render(
      <AppLayout>
        <div data-testid="main-content">Content</div>
      </AppLayout>
    )

    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('overflow-auto')
  })

  it('handles children prop correctly', () => {
    const testContent = (
      <div>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
        <button>Test Button</button>
      </div>
    )

    render(
      <AppLayout>
        {testContent}
      </AppLayout>
    )

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    expect(screen.getByText('Test Button')).toBeInTheDocument()
  })

  it('back button has correct styling and properties', () => {
    render(
      <AppLayout onBack={mockOnBack}>
        <div>Content</div>
      </AppLayout>
    )

    const backButton = screen.getByRole('button')
    expect(backButton).toHaveAttribute('data-size', 'sm')
    expect(backButton).toHaveAttribute('data-variant', 'ghost')
    expect(backButton).toHaveClass('h-8', 'w-8', 'p-0')
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

  it('maintains responsive design structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    const responsiveContainer = container.querySelector('.max-w-7xl')
    expect(responsiveContainer).toBeInTheDocument()
    
    const heightContainer = container.querySelector('.h-\\[calc\\(100vh-2rem\\)\\]')
    expect(heightContainer).toBeInTheDocument()
  })
})
