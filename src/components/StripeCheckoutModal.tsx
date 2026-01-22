import { useState, useEffect, useCallback } from 'react'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStripeContext } from '@/contexts/StripeContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { billingService } from '@/services/billing'
import { Loader2, Tag, Check, AlertCircle, X } from 'lucide-react'

interface StripeCheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceId: string
  planName: string
  planPrice: string
}

export function StripeCheckoutModal({
  open,
  onOpenChange,
  priceId,
  planName,
  planPrice,
}: StripeCheckoutModalProps) {
  const { stripePromise } = useStripeContext()
  const { refreshBillingStatus } = useSubscription()

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoValidated, setPromoValidated] = useState(false)
  const [discountPercent, setDiscountPercent] = useState<number | undefined>()
  const [promoError, setPromoError] = useState<string | null>(null)

  // Track if checkout has been initiated (to show promo code section or checkout)
  const [checkoutInitiated, setCheckoutInitiated] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setClientSecret(null)
      setLoading(false)
      setError(null)
      setPromoCode('')
      setPromoLoading(false)
      setPromoValidated(false)
      setDiscountPercent(undefined)
      setPromoError(null)
      setCheckoutInitiated(false)
    }
  }, [open])

  // Fetch client secret for embedded checkout
  const fetchClientSecret = useCallback(async () => {
    console.log('fetchClientSecret called, priceId:', priceId)
    setLoading(true)
    setError(null)

    try {
      console.log('Calling createEmbeddedCheckoutSession...')
      const response = await billingService.createEmbeddedCheckoutSession(
        priceId,
        promoValidated ? promoCode : undefined
      )
      console.log('Got response:', response)
      setClientSecret(response.client_secret)
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [priceId, promoValidated, promoCode])

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return

    setPromoLoading(true)
    setPromoError(null)

    try {
      const response = await billingService.validatePromoCode(promoCode.trim())
      if (response.valid) {
        setPromoValidated(true)
        setDiscountPercent(response.discount_percent)
      } else {
        setPromoError(response.error || 'Invalid promo code')
        setPromoValidated(false)
        setDiscountPercent(undefined)
      }
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Failed to validate promo code')
      setPromoValidated(false)
      setDiscountPercent(undefined)
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoCode('')
    setPromoValidated(false)
    setDiscountPercent(undefined)
    setPromoError(null)
    // Reset checkout if already initiated
    if (checkoutInitiated) {
      setClientSecret(null)
      setCheckoutInitiated(false)
    }
  }

  const handleProceedToCheckout = () => {
    console.log('handleProceedToCheckout called')
    setCheckoutInitiated(true)
    setLoading(true) // Set loading immediately to show spinner
    fetchClientSecret()
  }

  const handleComplete = useCallback(async () => {
    // Refresh billing status
    await refreshBillingStatus()
    // Close modal
    onOpenChange(false)
    // Navigate to account page with success param
    window.location.href = '/account?checkout=success'
  }, [refreshBillingStatus, onOpenChange])

  const calculateDiscountedPrice = () => {
    if (!discountPercent) return null
    const price = parseFloat(planPrice.replace('$', ''))
    const discounted = price * (1 - discountPercent / 100)
    return `$${discounted.toFixed(2)}`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={true}
      className="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Complete Your Subscription
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Subscribe to the {planName} plan
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-700 dark:text-slate-300">
            {planName} Plan
          </span>
          <div className="text-right">
            {discountPercent ? (
              <>
                <span className="text-slate-400 line-through mr-2">
                  {planPrice}/mo
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {calculateDiscountedPrice()}/mo
                </span>
              </>
            ) : (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {planPrice}/mo
              </span>
            )}
          </div>
        </div>
        {discountPercent && (
          <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
            <Check className="h-4 w-4" />
            <span>{discountPercent}% discount applied</span>
          </div>
        )}
      </div>

      {/* Promo Code Section (show before checkout is initiated) */}
      {!checkoutInitiated && (
        <div className="mb-4">
          {promoValidated ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Code <strong>{promoCode}</strong> applied ({discountPercent}% off)
                </span>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase())
                    setPromoError(null)
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleValidatePromo}
                  disabled={promoLoading || !promoCode.trim()}
                >
                  {promoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Tag className="h-4 w-4 mr-1" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
              {promoError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {promoError}
                </p>
              )}
            </div>
          )}

          {/* Proceed to Checkout Button */}
          <Button
            type="button"
            className="w-full mt-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleProceedToCheckout()
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}

      {/* Loading State */}
      {checkoutInitiated && loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Initializing checkout...
          </p>
        </div>
      )}

      {/* Error State */}
      {checkoutInitiated && error && !loading && (
        <div className="py-8">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  fetchClientSecret()
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Checkout */}
      {checkoutInitiated && !loading && !error && clientSecret && (
        <div className="min-h-[400px]">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              clientSecret,
              onComplete: handleComplete,
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}

      {checkoutInitiated && !loading && !error && clientSecret && (
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
          Your payment is secured by Stripe. Cancel anytime.
        </p>
      )}
    </Dialog>
  )
}
