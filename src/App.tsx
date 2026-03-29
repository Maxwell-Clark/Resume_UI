import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { StripeProvider } from '@/contexts/StripeContext'
import { TourProvider } from '@/contexts/TourContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthModal } from '@/components/AuthModal'
import { CheckoutSuccessModal } from '@/components/CheckoutSuccessModal'
import { PageSpinner } from '@/components/PageSpinner'
import { TemplateProvider } from '@/contexts/TemplateContext'

// Lazy-loaded page components
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const AccountSettingsPage = lazy(() => import('@/pages/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })))
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })))
const FAQPage = lazy(() => import('@/pages/FAQPage').then(m => ({ default: m.FAQPage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })))
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage').then(m => ({ default: m.FeaturesPage })))
const ResumeEditorPage = lazy(() => import('@/pages/ResumeEditorPage').then(m => ({ default: m.ResumeEditorPage })))
const ResumeStudioPage = lazy(() => import('@/pages/ResumeStudioPage').then(m => ({ default: m.ResumeStudioPage })))
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage').then(m => ({ default: m.TemplatesPage })))

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  )
}

// Checkout success handler component
function CheckoutSuccessHandler() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowSuccessModal(true)
      // Clear the URL param without causing a navigation
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('checkout')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <CheckoutSuccessModal
      open={showSuccessModal}
      onOpenChange={setShowSuccessModal}
    />
  )
}

// Redirect /login to home and open modal in login mode
function LoginRedirect() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    navigate('/', { replace: true })
    openAuthModal('login')
  }, [navigate, openAuthModal])

  return null
}

// Redirect /signup to home and open modal in signup mode
function SignupRedirect() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    navigate('/', { replace: true })
    openAuthModal('signup')
  }, [navigate, openAuthModal])

  return null
}

function HomeRoute() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If authenticated, redirect to studio page
  if (user) {
    return <Navigate to="/studio" replace />
  }
  
  // If not authenticated, show landing page
  return <LandingPage />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <StripeProvider>
          <SubscriptionProvider>
            <TemplateProvider>
            <AuthModalProvider>
              <TourProvider>
            <AuthModal />
            <CheckoutSuccessHandler />
            <ErrorBoundary>
            <Suspense fallback={<PageSpinner />}>
            <Routes>
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/signup" element={<SignupRedirect />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="studio" element={<ResumeStudioPage />} />
              <Route path="tailor" element={<Navigate to="/studio" replace />} />
              <Route path="match" element={<Navigate to="/studio" replace />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="editor" element={<ResumeEditorPage />} />
              <Route path="editor/:id" element={<ResumeEditorPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="account" element={<AccountSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
            </ErrorBoundary>
              </TourProvider>
            </AuthModalProvider>
            </TemplateProvider>
          </SubscriptionProvider>
        </StripeProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
