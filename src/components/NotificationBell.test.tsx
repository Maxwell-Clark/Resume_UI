import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from './NotificationBell'

// Mock the NotificationContext
const mockUseNotifications = vi.fn()
vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}))

describe('NotificationBell', () => {
  const mockMarkAsRead = vi.fn()
  const mockMarkAllAsRead = vi.fn()
  const mockRemoveNotification = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })
  })

  it('renders notification bell button', () => {
    render(<NotificationBell />)

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('does not show badge when no unread notifications', () => {
    render(<NotificationBell />)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows unread count badge when there are unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 5,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 9+ when unread count exceeds 9', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 15,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('opens dropdown when bell is clicked', async () => {
    const user = userEvent.setup()

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    expect(screen.getByText('Notifications')).toBeInTheDocument()

    // Click the overlay to close
    const overlay = document.querySelector('.fixed.inset-0')
    if (overlay) {
      await user.click(overlay)
    }

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
  })

  it('shows "No notifications" when empty', async () => {
    const user = userEvent.setup()

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })

  it('displays notifications list', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: '1',
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          displayed: false,
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText('Test Notification')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('shows mark all as read button when there are unread notifications', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: '1',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          displayed: false,
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText('Mark all as read')).toBeInTheDocument()
  })

  it('does not show mark all as read button when no unread notifications', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: '1',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: true,
          displayed: true,
        },
      ],
      unreadCount: 0,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument()
  })

  it('calls markAllAsRead when button is clicked', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: '1',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          displayed: false,
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await user.click(screen.getByText('Mark all as read'))

    expect(mockMarkAllAsRead).toHaveBeenCalled()
  })

  it('calls markAsRead when mark read button is clicked', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'test-id',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          displayed: false,
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await user.click(screen.getByText('Mark read'))

    expect(mockMarkAsRead).toHaveBeenCalledWith('test-id')
  })

  it('calls removeNotification when remove button is clicked', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'test-id',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          displayed: false,
        },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await user.click(screen.getByRole('button', { name: /remove notification/i }))

    expect(mockRemoveNotification).toHaveBeenCalledWith('test-id')
  })

  it('does not show mark read button for already read notifications', async () => {
    const user = userEvent.setup()
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 'test-id',
          title: 'Test',
          message: 'Message',
          type: 'info',
          timestamp: new Date(),
          read: true,
          displayed: true,
        },
      ],
      unreadCount: 0,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      removeNotification: mockRemoveNotification,
    })

    render(<NotificationBell />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.queryByText('Mark read')).not.toBeInTheDocument()
  })

  describe('formatRelativeTime', () => {
    it('shows "just now" for recent timestamps', async () => {
      const user = userEvent.setup()
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: new Date(),
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('just now')).toBeInTheDocument()
    })

    it('shows minutes ago', async () => {
      const user = userEvent.setup()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: fiveMinutesAgo,
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument()
    })

    it('shows singular minute', async () => {
      const user = userEvent.setup()
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: oneMinuteAgo,
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('1 minute ago')).toBeInTheDocument()
    })

    it('shows hours ago', async () => {
      const user = userEvent.setup()
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: threeHoursAgo,
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('3 hours ago')).toBeInTheDocument()
    })

    it('shows days ago', async () => {
      const user = userEvent.setup()
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: twoDaysAgo,
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('2 days ago')).toBeInTheDocument()
    })

    it('shows weeks ago', async () => {
      const user = userEvent.setup()
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      mockUseNotifications.mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test',
            message: 'Message',
            type: 'info',
            timestamp: twoWeeksAgo,
            read: false,
            displayed: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        removeNotification: mockRemoveNotification,
      })

      render(<NotificationBell />)

      await user.click(screen.getByRole('button', { name: /notifications/i }))

      expect(screen.getByText('2 weeks ago')).toBeInTheDocument()
    })
  })
})
