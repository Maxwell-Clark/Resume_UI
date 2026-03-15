import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  colorThresholds?: {
    low: number
    medium: number
  }
}

function getProgressColor(value: number, thresholds?: { low: number; medium: number }) {
  const { low = 40, medium = 70 } = thresholds || {}
  if (value >= medium) return 'bg-green-500 dark:bg-green-400'
  if (value >= low) return 'bg-yellow-500 dark:bg-yellow-400'
  return 'bg-red-500 dark:bg-red-400'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-5',
  lg: 'h-6',
}

function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  colorThresholds,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const colorClass = getProgressColor(percentage, colorThresholds)
  const showInnerLabel = label && size !== 'sm'

  return (
    <div className={cn("w-full", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        "w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative",
        sizeClasses[size]
      )}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${percentage}%` }}
        />
        {showInnerLabel && (
          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export { ProgressBar, getProgressColor }
