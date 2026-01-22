import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'guided_tours_completed'

export type TourId = 'studio' | 'history' | 'editor'

interface TourContextType {
  completedTours: Set<TourId>
  activeTour: TourId | null
  currentStep: number
  startTour: (tourId: TourId) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  resetTour: (tourId: TourId) => void
  resetAllTours: () => void
  isTourCompleted: (tourId: TourId) => boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [completedTours, setCompletedTours] = useState<Set<TourId>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TourId[]
        return new Set(parsed)
      }
    } catch (e) {
      console.error('Failed to load completed tours from localStorage:', e)
    }
    return new Set()
  })

  const [activeTour, setActiveTour] = useState<TourId | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Persist completed tours to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedTours]))
    } catch (e) {
      console.error('Failed to save completed tours to localStorage:', e)
    }
  }, [completedTours])

  const startTour = useCallback((tourId: TourId) => {
    setActiveTour(tourId)
    setCurrentStep(0)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])

  const skipTour = useCallback(() => {
    if (activeTour) {
      setCompletedTours(prev => {
        const updated = new Set(prev)
        updated.add(activeTour)
        return updated
      })
    }
    setActiveTour(null)
    setCurrentStep(0)
  }, [activeTour])

  const completeTour = useCallback(() => {
    if (activeTour) {
      setCompletedTours(prev => {
        const updated = new Set(prev)
        updated.add(activeTour)
        return updated
      })
    }
    setActiveTour(null)
    setCurrentStep(0)
  }, [activeTour])

  const resetTour = useCallback((tourId: TourId) => {
    setCompletedTours(prev => {
      const updated = new Set(prev)
      updated.delete(tourId)
      return updated
    })
  }, [])

  const resetAllTours = useCallback(() => {
    setCompletedTours(new Set())
    setActiveTour(null)
    setCurrentStep(0)
  }, [])

  const isTourCompleted = useCallback((tourId: TourId) => {
    return completedTours.has(tourId)
  }, [completedTours])

  return (
    <TourContext.Provider
      value={{
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
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTourContext must be used within a TourProvider')
  }
  return context
}
