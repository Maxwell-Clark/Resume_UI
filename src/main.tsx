import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastContainer } from './components/ToastContainer'

// Initialize PostHog before rendering
if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_pageview: 'history_change',
    autocapture: true,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <NotificationProvider>
          <App />
          <ToastContainer />
        </NotificationProvider>
      </ThemeProvider>
    </PostHogProvider>
  </StrictMode>,
)
