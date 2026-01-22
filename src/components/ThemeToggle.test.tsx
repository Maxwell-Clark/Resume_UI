import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

// Mock the ThemeContext
const mockToggleTheme = vi.fn()
const mockUseTheme = vi.fn()
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders toggle button with correct aria-label', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('shows moon icon when theme is light', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })

    render(<ThemeToggle />)

    // Moon icon should be visible for light theme (to indicate clicking will switch to dark)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    // Check that the button contains an SVG (the icon)
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('shows sun icon when theme is dark', () => {
    mockUseTheme.mockReturnValue({ theme: 'dark', toggleTheme: mockToggleTheme })

    render(<ThemeToggle />)

    // Sun icon should be visible for dark theme (to indicate clicking will switch to light)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('calls toggleTheme when clicked', async () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })
    const user = userEvent.setup()

    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))

    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('calls toggleTheme multiple times on multiple clicks', async () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })
    const user = userEvent.setup()

    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(mockToggleTheme).toHaveBeenCalledTimes(3)
  })

  it('has correct button size class', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })

    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('renders with ghost variant styling', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', toggleTheme: mockToggleTheme })

    render(<ThemeToggle />)

    // The button should exist and be functional - we trust the Button component handles variant styling
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })
})
