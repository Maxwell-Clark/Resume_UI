import { createContext, useContext, type ReactNode } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

// Initialize Stripe once at module level
let stripePromise: Promise<Stripe | null> | null = null

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise || Promise.resolve(null)
}

interface StripeContextType {
  stripePromise: Promise<Stripe | null>
}

const StripeContext = createContext<StripeContextType | null>(null)

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  const value: StripeContextType = {
    stripePromise: getStripe(),
  }

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  )
}

export function useStripeContext() {
  const context = useContext(StripeContext)
  if (!context) {
    throw new Error('useStripeContext must be used within a StripeProvider')
  }
  return context
}
