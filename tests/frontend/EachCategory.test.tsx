import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import EachCategory from '@/components/EachCategory'

// Mock the UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}))

describe('EachCategory', () => {
  const mockOnClick = jest.fn()

  const mockCategory = {
    id: 'test-category-1',
    name: 'Work Emails',
    description: 'Professional correspondence and work-related communications',
    color: 'bg-blue-500',
    emailCount: 15,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders category information correctly', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    // Check if the main container has the correct test ID
    expect(screen.getByTestId('category-test-category-1')).toBeInTheDocument()
    
    // Check if category name is displayed
    expect(screen.getByTestId('category-name')).toHaveTextContent('Work Emails')
    
    // Check if description is displayed
    expect(screen.getByTestId('category-description')).toHaveTextContent('Professional correspondence and work-related communications')
    
    // Check if email count badge is displayed
    expect(screen.getByTestId('category-email-count')).toHaveTextContent('15')
    
    // Check if color indicator is present
    expect(screen.getByTestId('category-color-indicator')).toBeInTheDocument()
  })

  it('displays active state correctly', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={true}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    expect(container).toHaveClass('bg-accent', 'border', 'border-primary/20')
    expect(container).toHaveAttribute('aria-pressed', 'true')
  })

  it('displays inactive state correctly', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    expect(container).not.toHaveClass('bg-accent', 'border', 'border-primary/20')
    expect(container).toHaveAttribute('aria-pressed', 'false')
  })

  it('handles click events correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    await user.click(container)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith('Work Emails', 'test-category-1')
  })

  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    container.focus()
    await user.keyboard('{Enter}')

    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith('Work Emails', 'test-category-1')
  })

  it('does not display email count badge when count is zero', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={0}
        onClick={mockOnClick}
      />
    )

    expect(screen.queryByTestId('category-email-count')).not.toBeInTheDocument()
  })

  it('displays email count badge only when count is greater than zero', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={5}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByTestId('category-email-count')).toBeInTheDocument()
    expect(screen.getByTestId('category-email-count')).toHaveTextContent('5')
  })

  it('applies correct color to color indicator', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const colorIndicator = screen.getByTestId('category-color-indicator')
    expect(colorIndicator).toHaveClass('bg-blue-500')
  })

  it('handles different color classes correctly', () => {
    const categoryWithDifferentColor = {
      ...mockCategory,
      color: 'bg-red-500',
    }

    render(
      <EachCategory
        category={categoryWithDifferentColor}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const colorIndicator = screen.getByTestId('category-color-indicator')
    expect(colorIndicator).toHaveClass('bg-red-500')
  })

  it('handles very long category names correctly', () => {
    const categoryWithLongName = {
      ...mockCategory,
      name: 'This is a very long category name that should be truncated in the UI to prevent overflow issues',
    }

    render(
      <EachCategory
        category={categoryWithLongName}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const nameElement = screen.getByTestId('category-name')
    expect(nameElement).toHaveClass('truncate')
    expect(nameElement).toHaveTextContent('This is a very long category name that should be truncated in the UI to prevent overflow issues')
  })

  it('handles very long descriptions correctly', () => {
    const categoryWithLongDescription = {
      ...mockCategory,
      description: 'This is a very long description that should be truncated in the UI to prevent overflow and maintain the layout integrity of the component when displaying multiple categories',
    }

    render(
      <EachCategory
        category={categoryWithLongDescription}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const descriptionElement = screen.getByTestId('category-description')
    expect(descriptionElement).toHaveClass('truncate')
    expect(descriptionElement).toHaveTextContent('This is a very long description that should be truncated in the UI to prevent overflow and maintain the layout integrity of the component when displaying multiple categories')
  })

  it('handles large email counts correctly', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={9999}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByTestId('category-email-count')).toHaveTextContent('9999')
  })

  it('handles single email count correctly', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={1}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByTestId('category-email-count')).toHaveTextContent('1')
  })

  it('has correct accessibility attributes', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    expect(container).toHaveAttribute('role', 'button')
    expect(container).toHaveAttribute('aria-pressed', 'false')
  })

  it('has correct CSS classes for styling', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    expect(container).toHaveClass('flex', 'items-center', 'gap-3', 'p-3', 'rounded-lg', 'hover:bg-accent/50', 'cursor-pointer', 'group', 'transition-colors')
  })

  it('handles empty description correctly', () => {
    const categoryWithEmptyDescription = {
      ...mockCategory,
      description: '',
    }

    render(
      <EachCategory
        category={categoryWithEmptyDescription}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const descriptionElement = screen.getByTestId('category-description')
    expect(descriptionElement).toHaveTextContent('')
  })

  it('handles category without color class correctly', () => {
    const categoryWithoutColor = {
      ...mockCategory,
      color: '',
    }

    render(
      <EachCategory
        category={categoryWithoutColor}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const colorIndicator = screen.getByTestId('category-color-indicator')
    expect(colorIndicator).toBeInTheDocument()
    // Should still have base classes but no color class
    expect(colorIndicator).toHaveClass('w-3', 'h-3', 'rounded-full')
  })

  it('maintains focus state correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    await user.tab()
    
    expect(container).toHaveFocus()
  })

  it('handles rapid clicks correctly', async () => {
    const user = userEvent.setup()
    
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const container = screen.getByTestId('category-test-category-1')
    
    // Simulate rapid clicks
    await user.click(container)
    await user.click(container)
    await user.click(container)

    expect(mockOnClick).toHaveBeenCalledTimes(3)
    expect(mockOnClick).toHaveBeenCalledWith('Work Emails', 'test-category-1')
  })

  it('badge has correct variant and styling', () => {
    render(
      <EachCategory
        category={mockCategory}
        isActive={false}
        emailCount={15}
        onClick={mockOnClick}
      />
    )

    const badge = screen.getByTestId('category-email-count')
    expect(badge).toHaveAttribute('data-variant', 'secondary')
    expect(badge).toHaveClass('ml-2', 'text-xs')
  })
})
