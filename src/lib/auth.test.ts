import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

// Must import after vi.mock so the mock is in place
import { supabase } from './supabase'
import { getAccessToken, authenticatedFetch, handleApiResponse } from './auth'

const mockGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('getAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns access token when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token-123' } },
    })

    const token = await getAccessToken()
    expect(token).toBe('test-token-123')
    expect(mockGetSession).toHaveBeenCalledOnce()
  })

  it('returns null when session is null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    const token = await getAccessToken()
    expect(token).toBeNull()
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
