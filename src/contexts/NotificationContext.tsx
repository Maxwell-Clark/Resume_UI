import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: Date
  read: boolean
  displayed: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'displayed'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  markAsDisplayed: (id: string) => void
  removeNotification: (id: string) => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'displayed'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      displayed: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markAsDisplayed = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, displayed: true } : n))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        markAsDisplayed,
        removeNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
