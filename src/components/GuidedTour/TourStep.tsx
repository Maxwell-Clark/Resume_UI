import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { TourStep as TourStepConfig } from './tourConfig'

interface TourStepProps {
  step: TourStepConfig
  stepNumber: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

interface Position {
  top: number
  left: number
  targetRect: DOMRect | null
}

export function TourStep({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  isFirstStep,
  isLastStep,
}: TourStepProps) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, targetRect: null })
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const calculatePosition = useCallback(() => {
    const targetElement = document.querySelector(`[data-tour="${step.target}"]`)

    if (!targetElement) {
      setPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
        targetRect: null,
      })
      return
    }

    const targetRect = targetElement.getBoundingClientRect()

    if (isMobile) {
      // On mobile we only need the targetRect for the spotlight — popover is fixed to bottom
      setPosition({ top: 0, left: 0, targetRect })
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Desktop: only need targetRect for spotlight — popover is CSS-centered
    setPosition({ top: 0, left: 0, targetRect })
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step.target, isMobile])

  useEffect(() => {
    setMounted(true)
    calculatePosition()

    const handleResize = () => calculatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [calculatePosition])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) {
          onComplete()
        } else {
          onNext()
        }
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        onPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onSkip, onComplete, isFirstStep, isLastStep])

  // Touch/swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y

      // Only trigger on horizontal swipes (not vertical scrolls)
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          // Swipe left → next
          if (isLastStep) onComplete()
          else onNext()
        } else {
          // Swipe right → previous
          if (!isFirstStep) onPrev()
        }
      }
      touchStartRef.current = null
    },
    [onNext, onPrev, onComplete, isFirstStep, isLastStep]
  )

  if (!mounted) return null

  // --- Overlay ---
  const spotlightOverlay = position.targetRect ? (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[90] bg-black/50 transition-opacity duration-200',
          isMobile && 'pointer-events-none'
        )}
        onClick={!isMobile ? onSkip : undefined}
      />
      {/* Spotlight cutout */}
      <div
        className="fixed z-[91] pointer-events-none"
        style={{
          top: position.targetRect.top - 4,
          left: position.targetRect.left - 4,
          width: position.targetRect.width + 8,
          height: position.targetRect.height + 8,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      />
      {/* Highlight ring */}
      <div
        className="fixed z-[92] pointer-events-none border-2 border-blue-500 rounded-lg animate-pulse"
        style={{
          top: position.targetRect.top - 4,
          left: position.targetRect.left - 4,
          width: position.targetRect.width + 8,
          height: position.targetRect.height + 8,
        }}
      />
    </>
  ) : (
    <div
      className={cn(
        'fixed inset-0 z-[90] bg-black/50 transition-opacity duration-200',
        isMobile && 'pointer-events-none'
      )}
      onClick={!isMobile ? onSkip : undefined}
    />
  )

  // --- Mobile bottom-sheet ---
  if (isMobile) {
    const mobileSheet = (
      <div
        className="fixed inset-x-0 bottom-0 z-[95] bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-8 duration-200 safe-area-bottom pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${stepNumber} of ${totalSteps}: ${step.title}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header with close */}
        <div className="flex items-center justify-between px-5 py-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Step {stepNumber} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {step.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Footer with navigation + progress dots */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isFirstStep}
            className="min-h-[44px] min-w-[44px] flex items-center gap-1"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">Previous</span>
          </Button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i + 1 === stepNumber
                    ? 'w-4 bg-blue-500'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                )}
              />
            ))}
          </div>

          {isLastStep ? (
            <Button
              size="sm"
              onClick={onComplete}
              className="min-h-[44px] flex items-center gap-1"
            >
              Finish Tour
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onNext}
              className="min-h-[44px] flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    )

    return createPortal(
      <>
        {spotlightOverlay}
        {mobileSheet}
      </>,
      document.body
    )
  }

  // --- Desktop popover (centered modal) ---
  const popover = (
    <div
      className="fixed z-[95] w-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in-0 zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Tour step ${stepNumber} of ${totalSteps}: ${step.title}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Step {stepNumber} of {totalSteps}
        </span>
        <button
          onClick={onSkip}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {step.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirstStep}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        {isLastStep ? (
          <Button size="sm" onClick={onComplete} className="flex items-center gap-1">
            Finish Tour
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className="flex items-center gap-1">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  )

  return createPortal(
    <>
      {spotlightOverlay}
      {popover}
    </>,
    document.body
  )
}
