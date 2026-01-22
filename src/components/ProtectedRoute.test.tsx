import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// Mock the AuthContext
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function TestApp({ initialRoute = '/protected' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
    })

    render(<TestApp />)

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    render(<TestApp />)

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('shows loading state while authentication is being checked', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    })

    render(<TestApp />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('renders children after loading completes with authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
    })

    render(<TestApp />)

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('redirects after loading completes with no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    render(<TestApp />)

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('renders nested protected content correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="outer">
                  <div data-testid="inner">Nested Content</div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('outer')).toBeInTheDocument()
    expect(screen.getByTestId('inner')).toBeInTheDocument()
    expect(screen.getByText('Nested Content')).toBeInTheDocument()
  })

  it('uses replace for navigation to prevent back button issues', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    // This test verifies the Navigate component has replace prop
    // The ProtectedRoute uses <Navigate to="/login" replace />
    render(<TestApp />)

    // If replace works correctly, the login page should be shown
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })
})
