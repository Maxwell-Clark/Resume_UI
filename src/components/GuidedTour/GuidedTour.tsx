import { useTour } from '@/hooks/useTour'
import type { TourId } from '@/contexts/TourContext'
import { getTourSteps } from './tourConfig'
import { TourStep } from './TourStep'

interface GuidedTourProps {
  tourId: TourId
  autoStart?: boolean
  autoStartDelay?: number
}

export function GuidedTour({ tourId, autoStart = true, autoStartDelay = 500 }: GuidedTourProps) {
  const {
    isActive,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useTour(tourId, { autoStart, autoStartDelay })

  const steps = getTourSteps(tourId)

  if (!isActive || steps.length === 0) {
    return null
  }

  // Filter out steps whose targets don't exist yet
  const availableSteps = steps.filter(step => {
    const element = document.querySelector(`[data-tour="${step.target}"]`)
    return element !== null
  })

  if (availableSteps.length === 0) {
    return null
  }

  // Adjust currentStep if it exceeds available steps
  const adjustedStep = Math.min(currentStep, availableSteps.length - 1)
  const step = availableSteps[adjustedStep]

  if (!step) {
    return null
  }

  const handleNext = () => {
    if (adjustedStep < availableSteps.length - 1) {
      nextStep()
    } else {
      completeTour()
    }
  }

  const handleComplete = () => {
    completeTour()
  }

  return (
    <TourStep
      step={step}
      stepNumber={adjustedStep + 1}
      totalSteps={availableSteps.length}
      onNext={handleNext}
      onPrev={prevStep}
      onSkip={skipTour}
      onComplete={handleComplete}
      isFirstStep={adjustedStep === 0}
      isLastStep={adjustedStep === availableSteps.length - 1}
    />
  )
}
