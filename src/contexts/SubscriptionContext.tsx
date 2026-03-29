import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { billingService, type BillingStatus } from '@/services/billing'
import { useAuth } from './AuthContext'

interface SubscriptionContextType {
  billingStatus: BillingStatus | null
  loading: boolean
  error: string | null
  isPro: boolean
  refreshBillingStatus: () => Promise<void>
}

const defaultBillingStatus: BillingStatus = {
  has_subscription: false,
  plan_name: 'free',
  status: 'none',
  current_period_end: null,
  cancel_at_period_end: false,
  trial_end: null,
  entitlements: {
    plan_name: 'free',
    tailors_per_month: 100,
    matches_per_month: 100,
    custom_prompts: false,
    priority_processing: false,
    history_retention_days: 30,
  },
  usage: {
    tailors_used: 0,
    matches_used: 0,
    period_start: null,
    period_end: null,
  },
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  billingStatus: null,
  loading: true,
  error: null,
  isPro: false,
  refreshBillingStatus: async () => {},
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBillingStatus = useCallback(async () => {
    if (!user) {
      setBillingStatus(defaultBillingStatus)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const status = await billingService.getBillingStatus()
      setBillingStatus(status)
    } catch (err) {
      // Error is logged; user-facing feedback is provided via the `error` state exposed by this context
      console.error('Failed to fetch billing status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load subscription status')
      setBillingStatus(defaultBillingStatus)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBillingStatus()
  }, [fetchBillingStatus])

  const isPro = billingStatus?.has_subscription === true &&
    (billingStatus?.status === 'active' || billingStatus?.status === 'trialing')

  return (
    <SubscriptionContext.Provider
      value={{
        billingStatus,
        loading,
        error,
        isPro,
        refreshBillingStatus: fetchBillingStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
