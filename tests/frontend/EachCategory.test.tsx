import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import EachCategory from '@/components/EachCategory'

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span {...props}>
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
    
    await user.click(container)
    await user.click(container)
    await user.click(container)

    expect(mockOnClick).toHaveBeenCalledTimes(3)
    expect(mockOnClick).toHaveBeenCalledWith('Work Emails', 'test-category-1')
  })
})
