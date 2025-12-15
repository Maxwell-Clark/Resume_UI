import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Get the current access token for API requests
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })
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



