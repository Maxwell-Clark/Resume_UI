import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreComparisonCardProps {
  baselineScore: number
  finalScore: number
  scoreImprovement: number
  attempts: number
  verificationPassed: boolean
  warnings: string[]
  compact?: boolean
}

export function ScoreComparisonCard({
  baselineScore,
  finalScore,
  scoreImprovement,
  attempts,
  verificationPassed,
  warnings,
  compact = false,
}: ScoreComparisonCardProps) {
  // Determine improvement status
  const isImproved = scoreImprovement > 0
  const isDecreased = scoreImprovement < 0

  // Status colors
  const statusColor = verificationPassed
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : warnings.length > 0
    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'

  const TrendIcon = isImproved ? TrendingUp : isDecreased ? TrendingDown : Minus
  const trendColor = isImproved
    ? 'text-green-600 dark:text-green-400'
    : isDecreased
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-500 dark:text-slate-400'

  if (compact) {
    return (
      <div className={cn('rounded-lg border p-3', statusColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {verificationPassed ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : warnings.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Score: {baselineScore}% → {finalScore}%
            </span>
          </div>
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {scoreImprovement > 0 ? '+' : ''}
              {scoreImprovement}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border overflow-hidden', statusColor)}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {verificationPassed ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : warnings.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {verificationPassed
                ? 'Tailoring Verified'
                : warnings.length > 0
                ? 'Tailoring Complete with Warnings'
                : 'Verification Failed'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {attempts} attempt{attempts !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Before</div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{baselineScore}%</div>
          </div>
          <div className="flex items-center justify-center">
            <div className={cn('flex items-center gap-1 px-3 py-1 rounded-full',
              isImproved ? 'bg-green-100 dark:bg-green-900/40' :
              isDecreased ? 'bg-red-100 dark:bg-red-900/40' :
              'bg-slate-100 dark:bg-slate-700'
            )}>
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
              <span className={cn('text-sm font-medium', trendColor)}>
                {scoreImprovement > 0 ? '+' : ''}{scoreImprovement}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">After</div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{finalScore}%</div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
