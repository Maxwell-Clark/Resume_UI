import { ProgressBar } from '@/components/ui/progress-bar'
import type { MatchScoreBreakdown } from '@/services/resume'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ScoreBreakdownPanelProps {
  breakdown: MatchScoreBreakdown
  defaultExpanded?: boolean
}

const scoreLabels: Record<keyof Omit<MatchScoreBreakdown, 'overall'>, string> = {
  skills_match: 'Skills Match',
  experience_match: 'Experience Match',
  education_match: 'Education Match',
  ats_compatibility: 'ATS Compatibility',
  ai_role_fit: 'AI Role Fit',
}

export function ScoreBreakdownPanel({ breakdown, defaultExpanded = false }: ScoreBreakdownPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const scores = Object.entries(breakdown).filter(([key]) => key !== 'overall') as [
    keyof Omit<MatchScoreBreakdown, 'overall'>,
    number
  ][]

  return (
    <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Score Breakdown
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {expanded && (
        <div className="p-3 space-y-3">
          {scores.map(([key, value]) => (
            <div key={key}>
              <ProgressBar value={value} size="md" label={`${scoreLabels[key]} ${value}%`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
