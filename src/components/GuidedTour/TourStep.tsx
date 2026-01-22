import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

  const calculatePosition = useCallback(() => {
    const targetElement = document.querySelector(`[data-tour="${step.target}"]`)
    if (!targetElement) {
      // If target not found, center the popover
      setPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
        targetRect: null,
      })
      return
    }

    const targetRect = targetElement.getBoundingClientRect()
    const popoverWidth = 320
    const popoverHeight = 180
    const offset = 12
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset

    let top = 0
    let left = 0
    const placement = step.placement || 'bottom'

    switch (placement) {
      case 'top':
        top = targetRect.top - popoverHeight - offset + scrollY
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2 + scrollX
        break
      case 'bottom':
        top = targetRect.bottom + offset + scrollY
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2 + scrollX
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2 + scrollY
        left = targetRect.left - popoverWidth - offset + scrollX
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2 + scrollY
        left = targetRect.right + offset + scrollX
        break
      case 'center':
        // Center the popover in the viewport while still highlighting the target
        top = window.innerHeight / 2 - popoverHeight / 2 + scrollY
        left = window.innerWidth / 2 - popoverWidth / 2 + scrollX
        break
    }

    // Keep within viewport bounds
    const padding = 16
    const maxLeft = window.innerWidth - popoverWidth - padding + scrollX
    const minLeft = padding + scrollX
    const maxTop = window.innerHeight - popoverHeight - padding + scrollY
    const minTop = padding + scrollY

    left = Math.max(minLeft, Math.min(maxLeft, left))
    top = Math.max(minTop, Math.min(maxTop, top))

    setPosition({ top, left, targetRect })

    // Scroll target into view if needed
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step.target, step.placement])

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

  // Handle keyboard navigation
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

  if (!mounted) return null

  const arrowClasses = {
    top: 'bottom-[-8px] left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-slate-800',
    bottom: 'top-[-8px] left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-slate-800',
    left: 'right-[-8px] top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-r-transparent border-l-white dark:border-l-slate-800',
    right: 'left-[-8px] top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-l-transparent border-r-white dark:border-r-slate-800',
  }

  const placement = step.placement || 'bottom'

  const spotlightOverlay = position.targetRect ? (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 z-[90] bg-black/50 transition-opacity duration-200" />
      {/* Spotlight cutout using box-shadow */}
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
      {/* Highlight ring around target */}
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
    <div className="fixed inset-0 z-[90] bg-black/50 transition-opacity duration-200" />
  )

  const popover = (
    <div
      className="fixed z-[95] w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ top: position.top, left: position.left }}
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

      {/* Arrow - don't show for center placement */}
      {position.targetRect && placement !== 'center' && (
        <span
          className={cn('absolute w-0 h-0', arrowClasses[placement as keyof typeof arrowClasses])}
          aria-hidden="true"
        />
      )}
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
