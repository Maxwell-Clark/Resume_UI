import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AccountSettingsPage } from '@/pages/AccountSettingsPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<HomeRoute />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="studio" element={<ResumeStudioPage />} />
            <Route path="tailor" element={<Navigate to="/studio?tab=tailor" replace />} />
            <Route path="match" element={<Navigate to="/studio?tab=match" replace />} />
            <Route path="editor" element={<ResumeEditorPage />} />
            <Route path="editor/:id" element={<ResumeEditorPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="account" element={<AccountSettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
