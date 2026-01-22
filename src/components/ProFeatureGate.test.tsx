import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProFeatureGate, ProButton } from './ProFeatureGate'

// Mock the SubscriptionContext
const mockUseSubscription = vi.fn()
vi.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: () => mockUseSubscription(),
}))

// Mock the UpgradeModal to avoid rendering complexity
vi.mock('@/components/UpgradeModal', () => ({
  UpgradeModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div data-testid="upgrade-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    ) : null,
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ProFeatureGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when user is Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: true, loading: false })

    render(
      <MemoryRouter>
        <ProFeatureGate>
          <div data-testid="pro-content">Pro Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    expect(screen.queryByText('Pro Feature')).not.toBeInTheDocument()
  })

  it('renders upgrade prompt when user is not Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    render(
      <MemoryRouter>
        <ProFeatureGate>
          <div data-testid="pro-content">Pro Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.getByText('Pro Feature')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('renders fallback when provided and user is not Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    render(
      <MemoryRouter>
        <ProFeatureGate fallback={<div data-testid="fallback">Fallback Content</div>}>
          <div data-testid="pro-content">Pro Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('renders nothing when showUpgradePrompt is false and user is not Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    const { container } = render(
      <MemoryRouter>
        <ProFeatureGate showUpgradePrompt={false}>
          <div data-testid="pro-content">Pro Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when loading', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: true })

    const { container } = render(
      <MemoryRouter>
        <ProFeatureGate>
          <div data-testid="pro-content">Pro Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(container.innerHTML).toBe('')
  })

  it('displays custom feature name', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    render(
      <MemoryRouter>
        <ProFeatureGate featureName="AI Resume Tailoring">
          <div>Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    expect(screen.getByText(/AI Resume Tailoring is available with a Pro subscription/)).toBeInTheDocument()
  })

  it('navigates to pricing when upgrade button is clicked', async () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ProFeatureGate>
          <div>Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /upgrade to pro/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/pricing')
  })

  it('applies custom className', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    render(
      <MemoryRouter>
        <ProFeatureGate className="custom-class">
          <div>Content</div>
        </ProFeatureGate>
      </MemoryRouter>
    )

    // The className is applied to the outer container div
    const container = screen.getByText('Pro Feature').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })
})

describe('ProButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onClick when user is Pro', async () => {
    mockUseSubscription.mockReturnValue({ isPro: true, loading: false })
    const mockOnClick = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ProButton onClick={mockOnClick}>Click Me</ProButton>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'Click Me' }))

    expect(mockOnClick).toHaveBeenCalled()
  })

  it('opens upgrade modal when user is not Pro', async () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })
    const mockOnClick = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ProButton onClick={mockOnClick}>Click Me</ProButton>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /Click Me/i }))

    expect(mockOnClick).not.toHaveBeenCalled()
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()
  })

  it('shows PRO badge when user is not Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })

    render(
      <MemoryRouter>
        <ProButton>Click Me</ProButton>
      </MemoryRouter>
    )

    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  it('does not show PRO badge when user is Pro', () => {
    mockUseSubscription.mockReturnValue({ isPro: true, loading: false })

    render(
      <MemoryRouter>
        <ProButton>Click Me</ProButton>
      </MemoryRouter>
    )

    expect(screen.queryByText('PRO')).not.toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: true })

    render(
      <MemoryRouter>
        <ProButton>Click Me</ProButton>
      </MemoryRouter>
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    mockUseSubscription.mockReturnValue({ isPro: true, loading: false })

    render(
      <MemoryRouter>
        <ProButton disabled>Click Me</ProButton>
      </MemoryRouter>
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('closes modal when close button is clicked', async () => {
    mockUseSubscription.mockReturnValue({ isPro: false, loading: false })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ProButton>Click Me</ProButton>
      </MemoryRouter>
    )

    // Open modal
    await user.click(screen.getByRole('button', { name: /Click Me/i }))
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument()

    // Close modal
    await user.click(screen.getByRole('button', { name: 'Close Modal' }))
    expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument()
  })
})
