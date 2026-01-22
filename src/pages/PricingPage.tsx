import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PublicLayout } from '@/components/PublicLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { billingService, type BillingStatus } from '@/services/billing'
import { StripeCheckoutModal } from '@/components/StripeCheckoutModal'
import { Check, Loader2, AlertCircle } from 'lucide-react'

// Get price IDs from environment variables
const STRIPE_PRICE_BASIC = import.meta.env.VITE_STRIPE_PRICE_BASIC || ''
const STRIPE_PRICE_PREMIUM = import.meta.env.VITE_STRIPE_PRICE_PREMIUM || ''

export function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stripe checkout modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    priceId: string
    name: string
    price: string
  } | null>(null)

  // Check for checkout cancelled message
  useEffect(() => {
    if (searchParams.get('checkout') === 'cancelled') {
      setError('Checkout was cancelled. Feel free to try again when you\'re ready.')
    }
  }, [searchParams])

  // Fetch billing status if user is logged in
  useEffect(() => {
    async function fetchBillingStatus() {
      if (!user) return

      try {
        setLoading(true)
        const status = await billingService.getBillingStatus()
        setBillingStatus(status)
      } catch (err) {
        console.error('Failed to fetch billing status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBillingStatus()
  }, [user])

  const handleSubscribe = (priceId: string, planName: string, planPrice: string) => {
    if (!user) {
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
      setLoading(true)
      await billingService.redirectToPortal()
    } catch (err) {
      console.error('Failed to open billing portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to open billing portal.')
      setLoading(false)
    }
  }

  const isCurrentPlan = (planName: string) => {
    if (!billingStatus) return false
    return billingStatus.plan_name.toLowerCase() === planName.toLowerCase()
  }

  const getButtonText = (plan: typeof plans[0]) => {
    if (isCurrentPlan(plan.name)) {
      return 'Current Plan'
    }

    if (plan.name === 'Free') {
      return user ? 'Current Plan' : 'Get Started'
    }

    if (plan.name === 'Enterprise') {
      return 'Contact Sales'
    }

    // Check if user has active subscription
    if (billingStatus?.has_subscription && billingStatus.status !== 'canceled') {
      return isCurrentPlan(plan.name) ? 'Current Plan' : 'Switch Plan'
    }

    return plan.cta
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      priceId: null,
      description: 'Perfect for trying out our service',
      features: [
        '5 resume tailors per month',
        '10 job matches per month',
        'Basic AI tailoring',
        'PDF download',
        'Resume history (30 days)',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Basic',
      price: '$12',
      period: 'per month',
      priceId: STRIPE_PRICE_BASIC,
      description: 'For active job seekers',
      features: [
        '50 resume tailors per month',
        '100 job matches per month',
        'Advanced AI tailoring',
        'AI Edit for text improvement',
        'PDF download',
        'Resume history (90 days)',
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
      description: 'For power users',
      features: [
        'Unlimited resume tailors',
        'Unlimited job matches',
        'Custom prompts',
        'Priority processing',
        'Resume history (unlimited)',
        'Priority support',
      ],
      cta: 'Subscribe Now',
      popular: false,
    },
  ]

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that works best for you. All plans include our core AI-powered resume tailoring.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 dark:text-red-400 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Current plan banner for logged in users */}
        {user && billingStatus && billingStatus.has_subscription && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-center">
              You're on the <strong className="capitalize">{billingStatus.plan_name}</strong> plan
              {billingStatus.status === 'trialing' && ' (trial)'}
              {billingStatus.cancel_at_period_end && ' (cancels at period end)'}
            </p>
            <div className="flex justify-center mt-2">
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage Billing'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white dark:bg-slate-800 rounded-lg border-2 p-8 ${
                plan.popular
                  ? 'border-blue-600 dark:border-blue-400 shadow-lg scale-105'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 dark:bg-blue-700 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    /{plan.period}
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                disabled={
                  loading ||
                  isCurrentPlan(plan.name) ||
                  (plan.name === 'Free' && user !== null)
                }
                onClick={() => {
                  if (plan.name === 'Enterprise') {
                    navigate('/contact')
                  } else if (plan.name === 'Free') {
                    if (!user) navigate('/signup')
                  } else if (plan.priceId) {
                    handleSubscribe(plan.priceId, plan.name, plan.price)
                  }
                }}
              >
                {getButtonText(plan)}
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            All plans include
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                AI-Powered Tailoring
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Advanced AI analyzes job descriptions and optimizes your resume
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Secure Storage
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your resumes are stored securely in the cloud
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ATS Optimization
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Resumes formatted to pass applicant tracking systems
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                What happens when my trial ends?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                After your 7-day trial, you'll be automatically charged the plan price. You can cancel anytime during the trial to avoid charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and Discover.
              </p>
            </div>
          </div>
        </div>
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
    </PublicLayout>
  )
}
