import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthModalProvider, useAuthModal } from './AuthModalContext'

// Test component to access context
function TestComponent() {
  const { isOpen, mode, openAuthModal, closeAuthModal, setMode } = useAuthModal()
  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => openAuthModal()}>Open Default</button>
      <button onClick={() => openAuthModal('signup')}>Open Signup</button>
      <button onClick={() => openAuthModal('login')}>Open Login</button>
      <button onClick={closeAuthModal}>Close</button>
      <button onClick={() => setMode('signup')}>Set Signup</button>
      <button onClick={() => setMode('login')}>Set Login</button>
    </div>
  )
}

describe('AuthModalContext', () => {
  it('initializes with modal closed and login mode', () => {
    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    expect(screen.getByTestId('isOpen')).toHaveTextContent('false')
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
  })

  it('opens modal with default login mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Default' }))

    expect(screen.getByTestId('isOpen')).toHaveTextContent('true')
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
  })

  it('opens modal with signup mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Signup' }))

    expect(screen.getByTestId('isOpen')).toHaveTextContent('true')
    expect(screen.getByTestId('mode')).toHaveTextContent('signup')
  })

  it('opens modal with login mode', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Login' }))

    expect(screen.getByTestId('isOpen')).toHaveTextContent('true')
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
  })

  it('closes modal', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Default' }))
    expect(screen.getByTestId('isOpen')).toHaveTextContent('true')

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('isOpen')).toHaveTextContent('false')
  })

  it('switches mode while modal is open', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Open Login' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('login')

    await user.click(screen.getByRole('button', { name: 'Set Signup' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('signup')
    expect(screen.getByTestId('isOpen')).toHaveTextContent('true')
  })

  it('sets mode directly using setMode', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('login')

    await user.click(screen.getByRole('button', { name: 'Set Signup' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('signup')

    await user.click(screen.getByRole('button', { name: 'Set Login' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
  })

  it('preserves mode after closing and reopening with default', async () => {
    const user = userEvent.setup()

    render(
      <AuthModalProvider>
        <TestComponent />
      </AuthModalProvider>
    )

    // Open with signup mode
    await user.click(screen.getByRole('button', { name: 'Open Signup' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('signup')

    // Close
    await user.click(screen.getByRole('button', { name: 'Close' }))

    // Reopen with default - should be login since openAuthModal sets mode
    await user.click(screen.getByRole('button', { name: 'Open Default' }))
    expect(screen.getByTestId('mode')).toHaveTextContent('login')
  })

  it('throws error when useAuthModal is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      'useAuthModal must be used within an AuthModalProvider'
    )

    consoleSpy.mockRestore()
  })
})
