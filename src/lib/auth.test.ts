import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
}))

// Must import after vi.mock so the mock is in place
import { supabase } from './supabase'
import { getAccessToken, authenticatedFetch, handleApiResponse } from './auth'

const mockGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>
const mockRefreshSession = supabase.auth.refreshSession as ReturnType<typeof vi.fn>

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const farFutureExpiry = () => Math.floor(Date.now() / 1000) + 3600 // 1h from now
const nearExpiry = () => Math.floor(Date.now() / 1000) + 10 // 10s from now
const pastExpiry = () => Math.floor(Date.now() / 1000) - 10 // 10s ago

describe('getAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns access token when session is fresh', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token-123', expires_at: farFutureExpiry() } },
    })

    const token = await getAccessToken()
    expect(token).toBe('test-token-123')
    expect(mockGetSession).toHaveBeenCalledOnce()
    expect(mockRefreshSession).not.toHaveBeenCalled()
  })

  it('returns null when session is null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    const token = await getAccessToken()
    expect(token).toBeNull()
    expect(mockRefreshSession).not.toHaveBeenCalled()
  })

  it('refreshes when session is near expiry and returns new token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'stale-token', expires_at: nearExpiry() } },
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'fresh-token', expires_at: farFutureExpiry() } },
      error: null,
    })

    const token = await getAccessToken()
    expect(token).toBe('fresh-token')
    expect(mockRefreshSession).toHaveBeenCalledOnce()
  })

  it('refreshes when session has already expired', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'expired-token', expires_at: pastExpiry() } },
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'brand-new-token', expires_at: farFutureExpiry() } },
      error: null,
    })

    const token = await getAccessToken()
    expect(token).toBe('brand-new-token')
    expect(mockRefreshSession).toHaveBeenCalledOnce()
  })

  it('falls back to existing token when refresh fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'stale-token', expires_at: nearExpiry() } },
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error('refresh failed'),
    })

    const token = await getAccessToken()
    expect(token).toBe('stale-token')
    expect(mockRefreshSession).toHaveBeenCalledOnce()
  })
})

describe('authenticatedFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds Authorization header when token exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'my-token' } },
    })
    mockFetch.mockResolvedValue(new Response('ok'))

    await authenticatedFetch('/test-endpoint')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('http://localhost:8000/test-endpoint')
    expect(options.headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('does not add Authorization header when no token', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    mockFetch.mockResolvedValue(new Response('ok'))

    await authenticatedFetch('/test-endpoint')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.has('Authorization')).toBe(false)
  })

  it('prefixes URL with API_BASE_URL', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    mockFetch.mockResolvedValue(new Response('ok'))

    await authenticatedFetch('/some/path')

    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe('http://localhost:8000/some/path')
  })

  it('passes through additional options', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
    })
    mockFetch.mockResolvedValue(new Response('ok'))

    await authenticatedFetch('/endpoint', {
      method: 'POST',
      body: '{"key":"value"}',
    })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBe('{"key":"value"}')
  })

  it('does not refresh when first fetch returns 200', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok', expires_at: farFutureExpiry() } },
    })
    mockFetch.mockResolvedValue(new Response('ok', { status: 200 }))

    await authenticatedFetch('/endpoint')

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockRefreshSession).not.toHaveBeenCalled()
  })

  it('refreshes and retries once on 401', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'stale-tok', expires_at: farFutureExpiry() } },
    })
    mockFetch
      .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'fresh-tok', expires_at: farFutureExpiry() } },
      error: null,
    })

    const response = await authenticatedFetch('/endpoint')

    expect(response.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockRefreshSession).toHaveBeenCalledOnce()
    // Second fetch must use the refreshed token
    const [, secondOptions] = mockFetch.mock.calls[1]
    expect(secondOptions.headers.get('Authorization')).toBe('Bearer fresh-tok')
  })

  it('returns original 401 response when refresh also fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'tok', expires_at: farFutureExpiry() } },
    })
    mockFetch.mockResolvedValue(new Response('unauthorized', { status: 401 }))
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error('refresh failed'),
    })

    const response = await authenticatedFetch('/endpoint')

    expect(response.status).toBe(401)
    expect(mockFetch).toHaveBeenCalledOnce() // no retry because refresh failed
    expect(mockRefreshSession).toHaveBeenCalledOnce()
  })
})

describe('handleApiResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login on 401 status', async () => {
    const originalHref = window.location.href
    // Mock window.location
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: originalHref,
    } as Location)

    // Create a writable location mock
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    })

    const response = new Response('Unauthorized', { status: 401 })

    await expect(handleApiResponse(response)).rejects.toThrow('Unauthorized')
    expect(mockLocation.href).toBe('/login')

    // Restore
    Object.defineProperty(window, 'location', {
      value: locationSpy.getMockImplementation?.() ?? window.location,
      writable: true,
      configurable: true,
    })
  })

  it('throws error with body text on non-ok response', async () => {
    const response = new Response('Something went wrong', { status: 500 })

    await expect(handleApiResponse(response)).rejects.toThrow('Something went wrong')
  })

  it('throws error with status code when body is empty', async () => {
    const response = new Response('', { status: 500 })

    await expect(handleApiResponse(response)).rejects.toThrow('HTTP error! status: 500')
  })

  it('returns parsed JSON on success', async () => {
    const data = { id: 1, name: 'test' }
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const result = await handleApiResponse<{ id: number; name: string }>(response)
    expect(result).toEqual(data)
  })
})
