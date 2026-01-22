import { useEffect, useCallback } from 'react'
import { useTourContext, type TourId } from '@/contexts/TourContext'

interface UseTourOptions {
  autoStart?: boolean
  autoStartDelay?: number
}

export function useTour(tourId: TourId, options: UseTourOptions = {}) {
  const { autoStart = true, autoStartDelay = 500 } = options

  const {
    activeTour,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    isTourCompleted,
    resetTour,
  } = useTourContext()

  const isActive = activeTour === tourId
  const shouldShowTour = !isTourCompleted(tourId)

  // Auto-start tour on first visit
  useEffect(() => {
    if (autoStart && shouldShowTour && !activeTour) {
      const timer = setTimeout(() => {
        startTour(tourId)
      }, autoStartDelay)
      return () => clearTimeout(timer)
    }
  }, [autoStart, shouldShowTour, activeTour, startTour, tourId, autoStartDelay])

  const start = useCallback(() => {
    startTour(tourId)
  }, [startTour, tourId])

  const reset = useCallback(() => {
    resetTour(tourId)
  }, [resetTour, tourId])

  return {
    isActive,
    currentStep,
    shouldShowTour,
    startTour: start,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour: reset,
  }
}
