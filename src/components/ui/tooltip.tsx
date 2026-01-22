import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export type TooltipProps = {
  /** The tooltip content */
  content: React.ReactNode
  /** The element that triggers the tooltip */
  children: React.ReactNode
  /** Delay before showing tooltip in ms */
  delay?: number
  /** Additional class for the tooltip */
  className?: string
  /** Whether the tooltip is disabled */
  disabled?: boolean
}

/**
 * Tooltip — a lightweight hover tooltip component
 * - Shows on hover/focus with configurable delay
 * - Displays at the top of the page for visibility
 * - Accessible via keyboard focus
 */
export function Tooltip({
  content,
  children,
  delay = 200,
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setMounted(true)
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const showTooltip = React.useCallback(() => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay, disabled])

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }, [])

  const tooltipContent = isVisible && mounted ? (
    <div
      role="tooltip"
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md",
        "rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-2 text-sm text-white shadow-lg",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200",
        className
      )}
    >
      {content}
    </div>
  ) : null

  return (
    <>
      <span
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        tabIndex={disabled ? undefined : 0}
        className="inline-flex cursor-help"
        aria-describedby={isVisible ? "tooltip" : undefined}
      >
        {children}
      </span>
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  )
}
