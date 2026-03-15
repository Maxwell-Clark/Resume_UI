import type { GapItem } from '@/services/resume'
import { AlertTriangle, AlertCircle, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GapCardProps {
  gap: GapItem
  compact?: boolean
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    label: 'Critical',
  },
  important: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    badgeColor: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    label: 'Important',
  },
  nice_to_have: {
    icon: Info,
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    borderColor: 'border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-500 dark:text-slate-400',
    badgeColor: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    label: 'Nice to have',
  },
}

const categoryColors: Record<string, string> = {
  skills: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  experience: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  education: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  keywords: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  default: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
}

export function GapCard({ gap, compact = false }: GapCardProps) {
  const config = severityConfig[gap.severity]
  const Icon = config.icon
  const categoryColor = categoryColors[gap.category] || categoryColors.default

  if (compact) {
    return (
      <div className={cn(
        "flex items-start gap-2 p-2 rounded-lg border",
        config.bgColor,
        config.borderColor
      )}>
        <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 dark:text-slate-300">{gap.description}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", config.badgeColor)}>
              {config.label}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", categoryColor)}>
              {gap.category}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      config.bgColor,
      config.borderColor
    )}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", config.badgeColor)}>
                {config.label}
              </span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded", categoryColor)}>
                {gap.category}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{gap.description}</p>
          </div>
        </div>
      </div>
      {gap.recommendation && (
        <div className="px-3 py-2 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">{gap.recommendation}</p>
        </div>
      )}
    </div>
  )
}
