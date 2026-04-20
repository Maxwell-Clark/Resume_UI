import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Refresh proactively if the current access token is within this many seconds
// of expiring. Covers the race where Supabase's background autoRefresh timer
// hasn't fired yet (e.g. tab was backgrounded or laptop just woke from sleep).
const REFRESH_THRESHOLD_SECONDS = 60

/**
 * Get the current access token for API requests.
 *
 * If the session is close to expiring, forces a refresh before returning the
 * token. Falls back to the existing (possibly expired) token if refresh fails
 * — authenticatedFetch will retry on 401.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const expiresAt = session.expires_at // seconds since epoch, may be undefined
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = expiresAt ? expiresAt - now : Number.POSITIVE_INFINITY

  if (timeLeft <= REFRESH_THRESHOLD_SECONDS) {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session) {
      return session.access_token
    }
    return data.session.access_token
  }

  return session.access_token
}

/**
 * Make an authenticated API request.
 *
 * Retries ONCE on 401 with a forcibly-refreshed token to absorb transient
 * token-expiry races between request send and backend validation.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })
  }

  const token = await getAccessToken()
  const response = await makeRequest(token)

  if (response.status !== 401) {
    return response
  }

  // Transient 401 — try once more with a freshly-refreshed token.
  const { data, error } = await supabase.auth.refreshSession()
  if (error || !data.session?.access_token) {
    // Refresh failed — let the caller handle the 401 (ultimately redirects to
    // /login via handleApiResponse).
    return response
  }

  return makeRequest(data.session.access_token)
}

/**
 * Handle API response and check for auth errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}
















