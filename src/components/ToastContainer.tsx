import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useNotifications, type Notification } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'

interface ToastProps {
  notification: Notification
  onClose: () => void
}

function Toast({ notification, onClose }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const styles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
  }

  const Icon = icons[notification.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-5',
        styles[notification.type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { notifications, markAsDisplayed } = useNotifications()
  // Only show notifications that haven't been displayed yet
  const undisplayedNotifications = notifications.filter(n => !n.displayed)
  const toasts = undisplayedNotifications.slice(0, 3) // Show max 3 toasts

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={() => markAsDisplayed(notification.id)}
        />
      ))}
    </div>
  )
}
