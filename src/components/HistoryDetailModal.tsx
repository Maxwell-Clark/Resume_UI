import { useState, useRef, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'
import { StrengthCard } from '@/components/StrengthCard'
import { GapCard } from '@/components/GapCard'
import {
  type HistoryItem,
  type StatusType,
  type WorkLocationType,
  type PriorityType,
  updateHistoryItem,
  hasEnhancedMatchData,
} from '@/lib/history'
import { cn } from '@/lib/utils'
import {
  Download,
  Edit,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase,
  User,
  Mail,
  Link,
  StickyNote,
  Flag,
  CheckCircle,
  Send,
  MessageSquare,
  Ban,
  UserX,
  Trophy,
  Loader2,
} from 'lucide-react'

interface HistoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: HistoryItem | null
  onItemUpdate: (updatedItem: HistoryItem) => void
  onEdit: (item: HistoryItem) => void
}

type EditableStatus = 'tailored' | 'applied' | 'interviewing' | 'rejected' | 'ghosted' | 'hired'

const statusConfig: Record<StatusType, { label: string; icon: typeof CheckCircle; style: string }> = {
  tailoring: {
    label: 'Tailoring',
    icon: Loader2,
    style: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
  },
  tailored: {
    label: 'Tailored',
    icon: CheckCircle,
    style: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  },
  applied: {
    label: 'Applied',
    icon: Send,
    style: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
  },
  interviewing: {
    label: 'Interviewing',
    icon: MessageSquare,
    style: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300',
  },
  rejected: {
    label: 'Rejected',
    icon: Ban,
    style: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  },
  ghosted: {
    label: 'Ghosted',
    icon: UserX,
    style: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300',
  },
  hired: {
    label: 'Hired',
    icon: Trophy,
    style: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  },
  complete: {
    label: 'Tailored',
    icon: CheckCircle,
    style: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    icon: Ban,
    style: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  },
}

const workLocationTypeLabels: Record<WorkLocationType, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  flexible: 'Flexible',
}


// Inline editable text component
function InlineEditableText({
  value,
  onSave,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  value: string
  onSave: (newValue: string) => Promise<void>
  placeholder: string
  type?: 'text' | 'url' | 'email'
  multiline?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    const className = "w-full px-2 py-1 text-sm border border-blue-400 dark:border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          rows={3}
          className={className}
        />
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={className}
      />
    )
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 -mx-1 transition-colors inline-block",
        !value && "text-slate-400 dark:text-slate-500 italic"
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  )
}

// Inline editable select component
function InlineEditableSelect<T extends string>({
  value,
  options,
  onSave,
  placeholder,
}: {
  value: T | undefined
  options: { value: T; label: string }[]
  onSave: (newValue: T | undefined) => Promise<void>
  placeholder: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = async (newValue: string) => {
    setIsSaving(true)
    try {
      await onSave(newValue ? (newValue as T) : undefined)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        autoFocus
        className="px-2 py-1 text-sm border border-blue-400 dark:border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">None</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  const selectedOption = options.find((o) => o.value === value)

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 -mx-1 transition-colors inline-block",
        !value && "text-slate-400 dark:text-slate-500 italic"
      )}
      title="Click to edit"
    >
      {selectedOption?.label || placeholder}
    </span>
  )
}

// Inline editable date component
function InlineEditableDate({
  value,
  onSave,
  placeholder,
}: {
  value: string | undefined
  onSave: (newValue: string | undefined) => Promise<void>
  placeholder: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const dateToInputValue = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const inputValueToIso = (inputValue: string) => {
    const [year, month, day] = inputValue.split('-').map(Number)
    const date = new Date(year, month - 1, day, 12, 0, 0)
    return date.toISOString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleChange = async (newValue: string) => {
    setIsSaving(true)
    try {
      await onSave(newValue ? inputValueToIso(newValue) : undefined)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save date:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value ? dateToInputValue(value) : ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        className="px-2 py-1 text-sm border border-blue-400 dark:border-blue-500 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 -mx-1 transition-colors inline-block",
        !value && "text-slate-400 dark:text-slate-500 italic"
      )}
      title="Click to edit"
    >
      {value ? formatDate(value) : placeholder}
    </span>
  )
}

// Collapsible section component
function CollapsibleSection({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {expanded && <div className="p-3 border-t dark:border-slate-700">{children}</div>}
    </div>
  )
}

export function HistoryDetailModal({
  open,
  onOpenChange,
  item,
  onItemUpdate,
  onEdit,
}: HistoryDetailModalProps) {
  if (!item) return null

  const statusInfo = statusConfig[item.status]
  const StatusIcon = statusInfo.icon
  const matchPercentage = item.match_results?.match_percentage

  const handleFieldUpdate = async (field: keyof HistoryItem, value: unknown) => {
    try {
      const updatedItem = await updateHistoryItem(item.id, { [field]: value })
      onItemUpdate(updatedItem)
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      throw error
    }
  }

  const handleDownload = () => {
    if (item.download_url) {
      window.open(item.download_url, '_blank')
    }
  }

  const handleEditResume = () => {
    onEdit(item)
    onOpenChange(false)
  }

  // Get status timeline from status_dates
  const getStatusTimeline = () => {
    const timeline: { status: StatusType; date: string; label: string }[] = []

    // Always add created
    timeline.push({
      status: 'tailored',
      date: item.created_at,
      label: 'Created',
    })

    // Add status dates
    const statusOrder: EditableStatus[] = ['tailored', 'applied', 'interviewing', 'rejected', 'ghosted', 'hired']
    statusOrder.forEach((status) => {
      const date = item.status_dates?.[status]
      if (date && status !== 'tailored') {
        timeline.push({
          status,
          date,
          label: statusConfig[status].label,
        })
      }
    })

    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return timeline
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const timeline = getStatusTimeline()

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b dark:border-slate-700 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                {item.job_title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{item.company}</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                statusInfo.style
              )}
            >
              <StatusIcon className={cn('h-3.5 w-3.5', item.status === 'tailoring' && 'animate-spin')} />
              {statusInfo.label}
            </span>
          </div>

          {/* Job Posting Link */}
          {item.job_posting_url && (
            <a
              href={item.job_posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Job Posting
            </a>
          )}

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
            {item.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>
            )}
            {item.work_location_type && (
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs">
                {workLocationTypeLabels[item.work_location_type]}
              </span>
            )}
            {item.salary_range && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>{item.salary_range}</span>
              </div>
            )}
            {item.industry && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>{item.industry}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <CollapsibleSection title="Status Timeline" defaultExpanded>
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-4">
              {timeline.map((entry, idx) => {
                const config = statusConfig[entry.status]
                const Icon = config.icon
                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute -left-4 mt-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center',
                        config.style
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {entry.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CollapsibleSection>

        {/* Additional Details */}
        <CollapsibleSection title="Additional Details" defaultExpanded>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Contact Person */}
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Contact</p>
                  <InlineEditableText
                    value={item.contact_person || ''}
                    onSave={(val) => handleFieldUpdate('contact_person', val || null)}
                    placeholder="Add contact..."
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Email</p>
                  <InlineEditableText
                    value={item.contact_email || ''}
                    onSave={(val) => handleFieldUpdate('contact_email', val || null)}
                    placeholder="Add email..."
                    type="email"
                  />
                </div>
              </div>

              {/* Source */}
              <div className="flex items-start gap-2">
                <Link className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Source</p>
                  <InlineEditableText
                    value={item.source || ''}
                    onSave={(val) => handleFieldUpdate('source', val || null)}
                    placeholder="Add source..."
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-2">
                <Flag className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Priority</p>
                  <InlineEditableSelect<PriorityType>
                    value={item.priority}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    onSave={(val) => handleFieldUpdate('priority', val)}
                    placeholder="Set priority..."
                  />
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Application Deadline</p>
                <InlineEditableDate
                  value={item.application_deadline}
                  onSave={(val) => handleFieldUpdate('application_deadline', val)}
                  placeholder="Set deadline..."
                />
              </div>
            </div>

            {/* Job Posting URL */}
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-slate-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Job Posting URL</p>
                <InlineEditableText
                  value={item.job_posting_url || ''}
                  onSave={(val) => handleFieldUpdate('job_posting_url', val || null)}
                  placeholder="Add URL..."
                  type="url"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Notes</p>
                <InlineEditableText
                  value={item.notes || ''}
                  onSave={(val) => handleFieldUpdate('notes', val || null)}
                  placeholder="Add notes..."
                  multiline
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Match Results */}
        {item.match_results && (
          <CollapsibleSection
            title={`Match Results${matchPercentage ? ` (${matchPercentage}%)` : ''}`}
            defaultExpanded={false}
          >
            <div className="space-y-4">
              {/* Score Breakdown */}
              {item.match_results.score_breakdown && (
                <ScoreBreakdownPanel breakdown={item.match_results.score_breakdown} defaultExpanded />
              )}

              {/* Strengths */}
              {hasEnhancedMatchData(item.match_results) && item.match_results.strengths_detailed && item.match_results.strengths_detailed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Strengths ({item.match_results.strengths_detailed.length})
                  </h4>
                  <div className="space-y-2">
                    {item.match_results.strengths_detailed.slice(0, 3).map((strength, idx) => (
                      <StrengthCard key={idx} strength={strength} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {hasEnhancedMatchData(item.match_results) && item.match_results.gaps_detailed && item.match_results.gaps_detailed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Gaps ({item.match_results.gaps_detailed.length})
                  </h4>
                  <div className="space-y-2">
                    {item.match_results.gaps_detailed.slice(0, 3).map((gap, idx) => (
                      <GapCard key={idx} gap={gap} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy strengths/gaps */}
              {!hasEnhancedMatchData(item.match_results) && (
                <>
                  {item.match_results.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {item.match_results.strengths.map((s, idx) => (
                          <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.match_results.gaps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gaps</h4>
                      <ul className="space-y-1">
                        {item.match_results.gaps.map((g, idx) => (
                          <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <Ban className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!item.download_url || item.status === 'tailoring' || item.status === 'failed'}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleEditResume}
            disabled={(!item.download_url && !item.resume_id) || item.status === 'tailoring' || item.status === 'failed'}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Resume
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
