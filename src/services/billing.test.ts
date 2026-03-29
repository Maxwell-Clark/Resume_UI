import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthenticatedFetch, mockHandleApiResponse } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn(),
  mockHandleApiResponse: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authenticatedFetch: mockAuthenticatedFetch,
  handleApiResponse: mockHandleApiResponse,
}))

import { billingService } from './billing'

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBillingStatus', () => {
    it('sends GET to /billing/status', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      const status = { has_subscription: true, plan_name: 'pro', status: 'active' }
      mockHandleApiResponse.mockResolvedValue(status)

      const result = await billingService.getBillingStatus()

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/billing/status')
      expect(result).toEqual(status)
    })
  })

  describe('createCheckoutSession', () => {
    it('sends POST with price_id, success and cancel URLs', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ checkout_url: 'https://stripe.com/checkout', session_id: 'sess_1' })

      await billingService.createCheckoutSession('price_123')

      const [url, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(url).toBe('/billing/checkout-session')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.price_id).toBe('price_123')
      expect(body.promo_code).toBeNull()
      expect(body.success_url).toContain('/account?checkout=success')
      expect(body.cancel_url).toContain('/pricing?checkout=cancelled')
    })

    it('includes promo_code when provided', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ checkout_url: '', session_id: '' })

      await billingService.createCheckoutSession('price_123', 'SAVE20')

      const body = JSON.parse(mockAuthenticatedFetch.mock.calls[0][1].body)
      expect(body.promo_code).toBe('SAVE20')
    })
  })

  describe('createPortalSession', () => {
    it('sends POST with return_url', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ portal_url: 'https://stripe.com/portal' })

      await billingService.createPortalSession()

      const [url, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(url).toBe('/billing/portal-session')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.return_url).toContain('/account')
    })
  })

  describe('redirectToCheckout', () => {
    it('sets window.location.href to checkout_url', async () => {
      const originalLocation = window.location

      // Mock window.location as writable
      const mockLocation = { ...originalLocation, href: '' } as Location
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      })

      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ checkout_url: 'https://stripe.com/pay', session_id: 's1' })

      await billingService.redirectToCheckout('price_abc')

      expect(mockLocation.href).toBe('https://stripe.com/pay')

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('validatePromoCode', () => {
    it('sends GET with URL-encoded code', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ valid: true, discount_percent: 20, code: 'SAVE 20' })

      await billingService.validatePromoCode('SAVE 20')

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/billing/validate-promo?code=SAVE%2020')
    })
  })

  describe('createSubscription', () => {
    it('sends POST with price_id and null promo_code by default', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ subscription_id: 'sub_1', client_secret: 'cs_1' })

      await billingService.createSubscription('price_99')

      const [url, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(url).toBe('/billing/create-subscription')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.price_id).toBe('price_99')
      expect(body.promo_code).toBeNull()
    })

    it('includes promo_code when provided', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ subscription_id: 'sub_1', client_secret: 'cs_1' })

      await billingService.createSubscription('price_99', 'DEAL50')

      const body = JSON.parse(mockAuthenticatedFetch.mock.calls[0][1].body)
      expect(body.promo_code).toBe('DEAL50')
    })
  })

  describe('createEmbeddedCheckoutSession', () => {
    it('sends POST with price_id and return_url', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ client_secret: 'ecs_secret' })

      await billingService.createEmbeddedCheckoutSession('price_embed')

      const [url, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(url).toBe('/billing/embedded-checkout-session')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body)
      expect(body.price_id).toBe('price_embed')
      expect(body.promo_code).toBeNull()
      expect(body.return_url).toContain('/account?checkout=success')
    })

    it('includes promo_code when provided', async () => {
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ client_secret: 'ecs_secret' })

      await billingService.createEmbeddedCheckoutSession('price_embed', 'CODE10')

      const body = JSON.parse(mockAuthenticatedFetch.mock.calls[0][1].body)
      expect(body.promo_code).toBe('CODE10')
    })
  })
})
