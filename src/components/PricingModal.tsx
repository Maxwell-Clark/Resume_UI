import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { billingService } from '@/services/billing'
import { StripeCheckoutModal } from '@/components/StripeCheckoutModal'
import { Check, AlertCircle, Crown, Zap } from 'lucide-react'

// Get price IDs from environment variables
const STRIPE_PRICE_BASIC = import.meta.env.VITE_STRIPE_PRICE_BASIC || ''
const STRIPE_PRICE_PREMIUM = import.meta.env.VITE_STRIPE_PRICE_PREMIUM || ''

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PricingModal({ open, onOpenChange }: PricingModalProps) {
  const { user } = useAuth()
  const { billingStatus } = useSubscription()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)

  // Stripe checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    priceId: string
    name: string
    price: string
  } | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setError(null)
      setSelectedPlan(null)
    }
  }, [open])

  const handleSubscribe = (priceId: string, planName: string, planPrice: string) => {
    if (!user) {
      onOpenChange(false)
      navigate('/signup')
      return
    }

    if (!priceId) {
      setError('Pricing not configured. Please contact support.')
      return
    }

    // Open Stripe checkout modal
    setSelectedPlan({ priceId, name: planName, price: planPrice })
    setCheckoutModalOpen(true)
  }

  const handleManageBilling = async () => {
    try {
      await billingService.redirectToPortal()
    } catch (err) {
      console.error('Failed to open billing portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to open billing portal.')
    }
  }

  const isCurrentPlan = (planName: string) => {
    const currentPlan = billingStatus?.entitlements?.plan_name || 'free'
    return currentPlan.toLowerCase() === planName.toLowerCase()
  }

  const hasActiveSubscription = billingStatus?.has_subscription && billingStatus?.status !== 'canceled'

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      priceId: null,
      icon: null,
      description: 'Try out our service',
      features: [
        '5 resume tailors per month',
        '10 job matches per month',
        'Basic AI tailoring',
        'PDF download',
      ],
      cta: 'Current Plan',
      popular: false,
    },
    {
      name: 'Basic',
      price: '$12',
      period: 'per month',
      priceId: STRIPE_PRICE_BASIC,
      icon: Zap,
      description: 'For active job seekers',
      features: [
        '50 resume tailors per month',
        '100 job matches per month',
        'Advanced AI tailoring',
        'PDF & LaTeX download',
        '7-day free trial',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$25',
      period: 'per month',
      priceId: STRIPE_PRICE_PREMIUM,
      icon: Crown,
      description: 'For power users',
      features: [
        'Unlimited resume tailors',
        'Unlimited job matches',
        'Custom prompts',
        'Priority processing',
        'Priority support',
      ],
      cta: 'Subscribe Now',
      popular: false,
    },
  ]

  const getButtonText = (plan: typeof plans[0]) => {
    if (isCurrentPlan(plan.name)) {
      return 'Current Plan'
    }

    if (plan.name === 'Free') {
      return 'Free Plan'
    }

    if (hasActiveSubscription) {
      return 'Switch Plan'
    }

    return plan.cta
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={true}
      className="max-w-3xl"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Unlock powerful AI features to supercharge your job search
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current plan banner */}
      {hasActiveSubscription && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You're on the <strong className="capitalize">{billingStatus?.entitlements?.plan_name}</strong> plan
            {billingStatus?.status === 'trialing' && ' (trial)'}
          </p>
          <Button variant="outline" size="sm" onClick={handleManageBilling}>
            Manage Billing
          </Button>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrent = isCurrentPlan(plan.name)

          return (
            <div
              key={plan.name}
              className={`rounded-lg border-2 p-4 ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : isCurrent
                  ? 'border-green-500 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 dark:bg-blue-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2">
                  Most Popular
                </div>
              )}
              {isCurrent && !plan.popular && (
                <div className="bg-green-600 dark:bg-green-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {plan.name}
                </h3>
              </div>

              <div className="mb-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">
                  /{plan.period}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                {plan.description}
              </p>

              <ul className="space-y-1.5 mb-4 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                size="sm"
                disabled={isCurrent || plan.name === 'Free'}
                onClick={() => {
                  if (plan.priceId) {
                    handleSubscribe(plan.priceId, plan.name, plan.price)
                  }
                }}
              >
                {getButtonText(plan)}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All paid plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>

      {/* Stripe Checkout Modal */}
      {selectedPlan && (
        <StripeCheckoutModal
          open={checkoutModalOpen}
          onOpenChange={(isOpen) => {
            setCheckoutModalOpen(isOpen)
            if (!isOpen) {
              setSelectedPlan(null)
            }
          }}
          priceId={selectedPlan.priceId}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
        />
      )}
    </Dialog>
  )
}
