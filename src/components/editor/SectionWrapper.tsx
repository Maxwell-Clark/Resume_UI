import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface SectionWrapperProps {
  icon: ReactNode
  title: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  actions?: ReactNode
}

export function SectionWrapper({
  icon,
  title,
  expanded,
  onToggle,
  children,
  actions,
}: SectionWrapperProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
      <div
        className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform ${expanded ? '' : '-rotate-90'}`}
          />
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        )}
      </div>
      {expanded && children}
    </section>
  )
}
