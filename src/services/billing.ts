import { authenticatedFetch, handleApiResponse } from '@/lib/auth'

export interface BillingStatus {
  has_subscription: boolean
  plan_name: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  entitlements: {
    plan_name: string
    tailors_per_month: number
    matches_per_month: number
    custom_prompts: boolean
    priority_processing: boolean
    history_retention_days: number
  }
  usage: {
    tailors_used: number
    matches_used: number
    period_start: string | null
    period_end: string | null
  }
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export interface PortalSessionResponse {
  portal_url: string
}

export interface CreateSubscriptionResponse {
  subscription_id: string
  client_secret: string
}

export interface EmbeddedCheckoutResponse {
  client_secret: string
}

export interface ValidatePromoCodeResponse {
  valid: boolean
  discount_percent?: number
  code?: string
  error?: string
}

export const billingService = {
  /**
   * Get current billing status and entitlements
   */
  async getBillingStatus(): Promise<BillingStatus> {
    const response = await authenticatedFetch('/billing/status')
    return handleApiResponse<BillingStatus>(response)
  },

  /**
   * Create a Stripe Checkout session
   */
  async createCheckoutSession(
    priceId: string,
    promoCode?: string
  ): Promise<CheckoutSessionResponse> {
    const successUrl = `${window.location.origin}/account?checkout=success`
    const cancelUrl = `${window.location.origin}/pricing?checkout=cancelled`

    const response = await authenticatedFetch('/billing/checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        promo_code: promoCode || null,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })
    return handleApiResponse<CheckoutSessionResponse>(response)
  },

  /**
   * Create a Stripe Customer Portal session
   */
  async createPortalSession(): Promise<PortalSessionResponse> {
    const returnUrl = `${window.location.origin}/account`

    const response = await authenticatedFetch('/billing/portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        return_url: returnUrl,
      }),
    })
    return handleApiResponse<PortalSessionResponse>(response)
  },

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(priceId: string, promoCode?: string): Promise<void> {
    const { checkout_url } = await this.createCheckoutSession(priceId, promoCode)
    window.location.href = checkout_url
  },

  /**
   * Redirect to Stripe Customer Portal
   */
  async redirectToPortal(): Promise<void> {
    const { portal_url } = await this.createPortalSession()
    window.location.href = portal_url
  },

  /**
   * Create a Stripe subscription and return client secret for payment
   */
  async createSubscription(
    priceId: string,
    promoCode?: string
  ): Promise<CreateSubscriptionResponse> {
    const response = await authenticatedFetch('/billing/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        promo_code: promoCode || null,
      }),
    })
    return handleApiResponse<CreateSubscriptionResponse>(response)
  },

  /**
   * Validate a promo code
   */
  async validatePromoCode(code: string): Promise<ValidatePromoCodeResponse> {
    const response = await authenticatedFetch(
      `/billing/validate-promo?code=${encodeURIComponent(code)}`
    )
    return handleApiResponse<ValidatePromoCodeResponse>(response)
  },

  /**
   * Create an embedded checkout session for Stripe Embedded Checkout
   */
  async createEmbeddedCheckoutSession(
    priceId: string,
    promoCode?: string
  ): Promise<EmbeddedCheckoutResponse> {
    const returnUrl = `${window.location.origin}/account?checkout=success`

    const response = await authenticatedFetch('/billing/embedded-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        promo_code: promoCode || null,
        return_url: returnUrl,
      }),
    })
    return handleApiResponse<EmbeddedCheckoutResponse>(response)
  },
}
