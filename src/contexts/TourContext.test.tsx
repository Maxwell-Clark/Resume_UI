import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourProvider, useTourContext } from './TourContext'

// Test component to access context
function TestComponent() {
  const {
    completedTours,
    activeTour,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
    resetAllTours,
    isTourCompleted,
  } = useTourContext()

  return (
    <div>
      <span data-testid="activeTour">{activeTour || 'none'}</span>
      <span data-testid="currentStep">{currentStep}</span>
      <span data-testid="completedCount">{completedTours.size}</span>
      <span data-testid="studioCompleted">{String(isTourCompleted('studio'))}</span>
      <span data-testid="historyCompleted">{String(isTourCompleted('history'))}</span>
      <span data-testid="editorCompleted">{String(isTourCompleted('editor'))}</span>
      <button onClick={() => startTour('studio')}>Start Studio</button>
      <button onClick={() => startTour('history')}>Start History</button>
      <button onClick={() => startTour('editor')}>Start Editor</button>
      <button onClick={nextStep}>Next</button>
      <button onClick={prevStep}>Prev</button>
      <button onClick={skipTour}>Skip</button>
      <button onClick={completeTour}>Complete</button>
      <button onClick={() => resetTour('studio')}>Reset Studio</button>
      <button onClick={resetAllTours}>Reset All</button>
    </div>
  )
}

describe('TourContext', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockClear()
  })

  it('initializes with no active tour and step 0', () => {
    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    expect(screen.getByTestId('activeTour')).toHaveTextContent('none')
    expect(screen.getByTestId('currentStep')).toHaveTextContent('0')
    expect(screen.getByTestId('completedCount')).toHaveTextContent('0')
  })

  it('starts a tour', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))

    expect(screen.getByTestId('activeTour')).toHaveTextContent('studio')
    expect(screen.getByTestId('currentStep')).toHaveTextContent('0')
  })

  it('navigates to next step', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByTestId('currentStep')).toHaveTextContent('1')
  })

  it('navigates to previous step', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Prev' }))

    expect(screen.getByTestId('currentStep')).toHaveTextContent('1')
  })

  it('does not go below step 0', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Prev' }))

    expect(screen.getByTestId('currentStep')).toHaveTextContent('0')
  })

  it('completes a tour', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))

    expect(screen.getByTestId('activeTour')).toHaveTextContent('none')
    expect(screen.getByTestId('currentStep')).toHaveTextContent('0')
    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('true')
    expect(screen.getByTestId('completedCount')).toHaveTextContent('1')
  })

  it('skips a tour and marks it completed', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start History' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(screen.getByTestId('activeTour')).toHaveTextContent('none')
    expect(screen.getByTestId('historyCompleted')).toHaveTextContent('true')
  })

  it('resets a specific tour', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    // Complete the studio tour
    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))
    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('true')

    // Reset it
    await user.click(screen.getByRole('button', { name: 'Reset Studio' }))
    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('false')
  })

  it('resets all tours', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    // Complete multiple tours
    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))
    await user.click(screen.getByRole('button', { name: 'Start History' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))

    expect(screen.getByTestId('completedCount')).toHaveTextContent('2')

    // Reset all
    await user.click(screen.getByRole('button', { name: 'Reset All' }))

    expect(screen.getByTestId('completedCount')).toHaveTextContent('0')
    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('false')
    expect(screen.getByTestId('historyCompleted')).toHaveTextContent('false')
  })

  it('persists completed tours to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))

    expect(localStorage.setItem).toHaveBeenCalledWith('guided_tours_completed', '["studio"]')
  })

  it('loads completed tours from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('["studio","history"]')

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('true')
    expect(screen.getByTestId('historyCompleted')).toHaveTextContent('true')
    expect(screen.getByTestId('completedCount')).toHaveTextContent('2')
  })

  it('handles invalid localStorage data gracefully', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json')

    // Should not throw and should default to empty set
    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    expect(screen.getByTestId('completedCount')).toHaveTextContent('0')
  })

  it('isTourCompleted returns correct values', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('false')
    expect(screen.getByTestId('editorCompleted')).toHaveTextContent('false')

    await user.click(screen.getByRole('button', { name: 'Start Editor' }))
    await user.click(screen.getByRole('button', { name: 'Complete' }))

    expect(screen.getByTestId('studioCompleted')).toHaveTextContent('false')
    expect(screen.getByTestId('editorCompleted')).toHaveTextContent('true')
  })

  it('resets step when starting a new tour', async () => {
    const user = userEvent.setup()

    render(
      <TourProvider>
        <TestComponent />
      </TourProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Start Studio' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByTestId('currentStep')).toHaveTextContent('2')

    // Start a different tour
    await user.click(screen.getByRole('button', { name: 'Start History' }))
    expect(screen.getByTestId('currentStep')).toHaveTextContent('0')
    expect(screen.getByTestId('activeTour')).toHaveTextContent('history')
  })

  it('throws error when useTourContext is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      'useTourContext must be used within a TourProvider'
    )

    consoleSpy.mockRestore()
  })
})
