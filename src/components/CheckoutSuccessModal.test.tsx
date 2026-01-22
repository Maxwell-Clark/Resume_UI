import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CheckoutSuccessModal } from './CheckoutSuccessModal'

// Mock the SubscriptionContext
const mockRefreshBillingStatus = vi.fn()
const mockUseSubscription = vi.fn()
vi.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: () => mockUseSubscription(),
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

describe('CheckoutSuccessModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays "Pro" for premium plan', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'premium',
          tailors_per_month: -1,
          matches_per_month: -1,
          custom_prompts: true,
          priority_processing: true,
          history_retention_days: 365,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome to Pro!')).toBeInTheDocument()
  })

  it('displays "Basic" for pro plan', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome to Basic!')).toBeInTheDocument()
  })

  it('shows "Get Started with Pro" button for premium plan', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'premium',
          tailors_per_month: -1,
          matches_per_month: -1,
          custom_prompts: true,
          priority_processing: true,
          history_retention_days: 365,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /get started with pro/i })).toBeInTheDocument()
  })

  it('shows "Get Started" button for non-premium plan', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /get started$/i })
    expect(button).toBeInTheDocument()
  })

  it('displays unlimited features correctly', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'premium',
          tailors_per_month: -1,
          matches_per_month: -1,
          custom_prompts: true,
          priority_processing: true,
          history_retention_days: 365,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('Unlimited AI-powered resume tailoring')).toBeInTheDocument()
    expect(screen.getByText('Unlimited job match analyses')).toBeInTheDocument()
  })

  it('displays limited features with counts', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 30,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('50 AI-powered resume tailors per month')).toBeInTheDocument()
    expect(screen.getByText('30 job match analyses per month')).toBeInTheDocument()
  })

  it('displays custom prompts feature when available', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'premium',
          tailors_per_month: -1,
          matches_per_month: -1,
          custom_prompts: true,
          priority_processing: false,
          history_retention_days: 365,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('Custom AI prompts')).toBeInTheDocument()
  })

  it('displays AI-powered editing when custom prompts not available', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('AI-powered editing')).toBeInTheDocument()
  })

  it('displays priority processing when available', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'premium',
          tailors_per_month: -1,
          matches_per_month: -1,
          custom_prompts: true,
          priority_processing: true,
          history_retention_days: 365,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('Priority processing')).toBeInTheDocument()
  })

  it('does not display priority processing when not available', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.queryByText('Priority processing')).not.toBeInTheDocument()
  })

  it('displays history retention days', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByText('90-day history retention')).toBeInTheDocument()
  })

  it('navigates to studio when CTA button is clicked', async () => {
    vi.useRealTimers() // Use real timers for this test
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })
    const mockOnOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={mockOnOpenChange} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /get started/i }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockNavigate).toHaveBeenCalledWith('/studio')
  })

  it('refreshes billing status when modal opens', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    // Advance timers to trigger the refresh calls
    vi.advanceTimersByTime(600)
    expect(mockRefreshBillingStatus).toHaveBeenCalled()
  })

  it('shows loading indicator when billing is loading', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {
        entitlements: {
          plan_name: 'pro',
          tailors_per_month: 50,
          matches_per_month: 50,
          custom_prompts: false,
          priority_processing: false,
          history_retention_days: 90,
        },
      },
      loading: true,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    // The loading spinner should be present (Loader2 with animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('handles missing entitlements gracefully', () => {
    mockUseSubscription.mockReturnValue({
      billingStatus: {},
      loading: false,
      refreshBillingStatus: mockRefreshBillingStatus,
    })

    render(
      <MemoryRouter>
        <CheckoutSuccessModal open={true} onOpenChange={() => {}} />
      </MemoryRouter>
    )

    // Should default to "Basic" when plan_name is not available
    expect(screen.getByText('Welcome to Basic!')).toBeInTheDocument()
  })
})
