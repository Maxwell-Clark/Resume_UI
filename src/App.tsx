import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { StripeProvider } from '@/contexts/StripeContext'
import { TourProvider } from '@/contexts/TourContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthModal } from '@/components/AuthModal'
import { CheckoutSuccessModal } from '@/components/CheckoutSuccessModal'
import { LandingPage } from '@/pages/LandingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AccountSettingsPage } from '@/pages/AccountSettingsPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { PricingPage } from '@/pages/PricingPage'
import { FAQPage } from '@/pages/FAQPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { ResumeEditorPage } from '@/pages/ResumeEditorPage'
import { ResumeStudioPage } from '@/pages/ResumeStudioPage'

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
            <AuthModalProvider>
              <TourProvider>
            <AuthModal />
            <CheckoutSuccessHandler />
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
              <Route path="editor" element={<ResumeEditorPage />} />
              <Route path="editor/:id" element={<ResumeEditorPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="account" element={<AccountSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </TourProvider>
            </AuthModalProvider>
          </SubscriptionProvider>
        </StripeProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
