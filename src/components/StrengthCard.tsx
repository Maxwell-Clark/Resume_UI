import type { StrengthItem } from '@/services/resume'
import { ProgressBar } from '@/components/ui/progress-bar'
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StrengthCardProps {
  strength: StrengthItem
  compact?: boolean
}

const categoryColors: Record<string, string> = {
  skills: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  experience: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  education: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  default: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
}

export function StrengthCard({ strength, compact = false }: StrengthCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasEvidence = strength.evidence && strength.evidence.length > 0

  const categoryColor = categoryColors[strength.category] || categoryColors.default

  if (compact) {
    return (
      <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 dark:text-slate-300">{strength.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", categoryColor)}>
              {strength.category}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {strength.confidence}% confidence
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300">{strength.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-xs px-1.5 py-0.5 rounded", categoryColor)}>
                {strength.category}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Confidence</span>
            <span className="text-green-600 dark:text-green-400">{strength.confidence}%</span>
          </div>
          <ProgressBar
            value={strength.confidence}
            size="sm"
            colorThresholds={{ low: 0, medium: 0 }}
          />
        </div>
      </div>
      {hasEvidence && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-600 dark:text-slate-400 bg-green-100/50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <span>Evidence ({strength.evidence.length})</span>
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {expanded && (
            <ul className="px-3 py-2 space-y-1 bg-green-100/30 dark:bg-green-900/20">
              {strength.evidence.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-0">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
