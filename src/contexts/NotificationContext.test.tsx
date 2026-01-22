import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationProvider, useNotifications } from './NotificationContext'

// Test component to access context
function TestComponent() {
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    markAsDisplayed,
    removeNotification,
    unreadCount,
  } = useNotifications()

  return (
    <div>
      <span data-testid="unreadCount">{unreadCount}</span>
      <span data-testid="notificationCount">{notifications.length}</span>
      <button
        onClick={() =>
          addNotification({
            title: 'Test Title',
            message: 'Test Message',
            type: 'info',
          })
        }
      >
        Add Info
      </button>
      <button
        onClick={() =>
          addNotification({
            title: 'Success Title',
            message: 'Success Message',
            type: 'success',
          })
        }
      >
        Add Success
      </button>
      <button onClick={markAllAsRead}>Mark All Read</button>
      <ul>
        {notifications.map((n) => (
          <li key={n.id} data-testid={`notification-${n.id}`}>
            <span data-testid={`title-${n.id}`}>{n.title}</span>
            <span data-testid={`read-${n.id}`}>{String(n.read)}</span>
            <span data-testid={`displayed-${n.id}`}>{String(n.displayed)}</span>
            <button onClick={() => markAsRead(n.id)}>Mark Read {n.id}</button>
            <button onClick={() => markAsDisplayed(n.id)}>Mark Displayed {n.id}</button>
            <button onClick={() => removeNotification(n.id)}>Remove {n.id}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('NotificationContext', () => {
  it('initializes with empty notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    expect(screen.getByTestId('notificationCount')).toHaveTextContent('0')
    expect(screen.getByTestId('unreadCount')).toHaveTextContent('0')
  })

  it('adds a notification', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))

    expect(screen.getByTestId('notificationCount')).toHaveTextContent('1')
    expect(screen.getByTestId('unreadCount')).toHaveTextContent('1')
  })

  it('adds notification with correct properties', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))

    const notifications = screen.getAllByRole('listitem')
    expect(notifications).toHaveLength(1)

    // Check title is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('adds multiple notifications with newest first', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    await user.click(screen.getByRole('button', { name: 'Add Success' }))

    expect(screen.getByTestId('notificationCount')).toHaveTextContent('2')
    expect(screen.getByTestId('unreadCount')).toHaveTextContent('2')

    // Newest should be first (Success Title)
    const notifications = screen.getAllByRole('listitem')
    expect(notifications[0]).toHaveTextContent('Success Title')
    expect(notifications[1]).toHaveTextContent('Test Title')
  })

  it('marks a notification as read', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    expect(screen.getByTestId('unreadCount')).toHaveTextContent('1')

    // Get the notification id from the rendered notification
    const readButton = screen.getByRole('button', { name: /^Mark Read/ })
    await user.click(readButton)

    expect(screen.getByTestId('unreadCount')).toHaveTextContent('0')
  })

  it('marks all notifications as read', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    await user.click(screen.getByRole('button', { name: 'Add Success' }))

    expect(screen.getByTestId('unreadCount')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: 'Mark All Read' }))

    expect(screen.getByTestId('unreadCount')).toHaveTextContent('0')
  })

  it('marks a notification as displayed', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))

    // Find and click the mark displayed button
    const displayedButton = screen.getByRole('button', { name: /^Mark Displayed/ })
    await user.click(displayedButton)

    // Verify the displayed state changed
    const notification = screen.getByRole('listitem')
    expect(notification).toHaveTextContent('true') // displayed is now true
  })

  it('removes a notification', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    expect(screen.getByTestId('notificationCount')).toHaveTextContent('1')

    const removeButton = screen.getByRole('button', { name: /^Remove/ })
    await user.click(removeButton)

    expect(screen.getByTestId('notificationCount')).toHaveTextContent('0')
    expect(screen.getByTestId('unreadCount')).toHaveTextContent('0')
  })

  it('calculates unread count correctly', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Add 3 notifications
    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    await user.click(screen.getByRole('button', { name: 'Add Success' }))
    await user.click(screen.getByRole('button', { name: 'Add Info' }))

    expect(screen.getByTestId('unreadCount')).toHaveTextContent('3')

    // Mark one as read
    const readButtons = screen.getAllByRole('button', { name: /^Mark Read/ })
    await user.click(readButtons[0])

    expect(screen.getByTestId('unreadCount')).toHaveTextContent('2')
  })

  it('throws error when useNotifications is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      'useNotifications must be used within a NotificationProvider'
    )

    consoleSpy.mockRestore()
  })

  it('generates unique ids for notifications', async () => {
    const user = userEvent.setup()

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Add Info' }))
    await user.click(screen.getByRole('button', { name: 'Add Info' }))

    const notifications = screen.getAllByRole('listitem')
    const ids = notifications.map((n) => n.getAttribute('data-testid'))

    // All ids should be unique
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
