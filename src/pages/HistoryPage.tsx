import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { History, Download, FileText, Calendar, Loader2, CheckCircle, XCircle, ChevronDown, Send, MessageSquare, Ban, UserX, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { getHistoryItems, updateHistoryItem, type HistoryItem } from '@/lib/history'
import { cn } from '@/lib/utils'

type EditableStatus = 'tailored' | 'applied' | 'interviewing' | 'rejected' | 'ghosted' | 'hired'

const statusConfig: Record<HistoryItem['status'], { label: string; icon: typeof Loader2; style: string }> = {
  tailoring: {
    label: 'Tailoring',
    icon: Loader2,
    style: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  },
  tailored: {
    label: 'Tailored',
    icon: CheckCircle,
    style: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  applied: {
    label: 'Applied',
    icon: Send,
    style: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  interviewing: {
    label: 'Interviewing',
    icon: MessageSquare,
    style: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  rejected: {
    label: 'Rejected',
    icon: Ban,
    style: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  ghosted: {
    label: 'Ghosted',
    icon: UserX,
    style: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  },
  hired: {
    label: 'Hired',
    icon: Trophy,
    style: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  complete: {
    label: 'Complete',
    icon: CheckCircle,
    style: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    style: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  },
}

const editableStatuses: EditableStatus[] = ['tailored', 'applied', 'interviewing', 'rejected', 'ghosted', 'hired']

const StatusBadge = ({ 
  status, 
  onStatusChange 
}: { 
  status: HistoryItem['status']
  onStatusChange: (newStatus: EditableStatus) => Promise<void>
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const config = statusConfig[status]
  const Icon = config.icon
  const isEditable = status !== 'tailoring' && editableStatuses.includes(status as EditableStatus)
  const isCompleteOrFailed = status === 'complete' || status === 'failed'

  // For complete/failed statuses, convert to 'tailored' for editing
  const currentEditableStatus = isCompleteOrFailed ? 'tailored' : (status as EditableStatus)

  const handleStatusSelect = async (newStatus: EditableStatus) => {
    setPopoverOpen(false)
    await onStatusChange(newStatus)
  }

  if (status === 'tailoring') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
          config.style
        )}
      >
        <Icon className={cn('h-3 w-3 animate-spin')} />
        {config.label}
      </span>
    )
  }

  if (!isEditable && !isCompleteOrFailed) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
          config.style
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      trigger={
        <button
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
            config.style
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
          <ChevronDown className="h-3 w-3" />
        </button>
      }
      align="end"
      side="bottom"
    >
      <div className="p-1 min-w-[160px]">
        {editableStatuses.map((statusOption) => {
          const optionConfig = statusConfig[statusOption]
          const OptionIcon = optionConfig.icon
          const isSelected = statusOption === currentEditableStatus
          
          return (
            <button
              key={statusOption}
              onClick={() => handleStatusSelect(statusOption)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                isSelected && 'bg-slate-100 dark:bg-slate-700'
              )}
            >
              <OptionIcon className="h-4 w-4" />
              <span>{optionConfig.label}</span>
              {isSelected && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}

export function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Load history from API
    const loadHistory = async () => {
      try {
        const items = await getHistoryItems()
        setHistoryItems(items)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadHistory()

    // Poll for updates on tailoring items every 3 seconds
    const interval = setInterval(() => {
      loadHistory()
    }, 3000)

    return () => clearInterval(interval)
  }, [location.pathname])

  const handleStatusChange = async (itemId: string, newStatus: EditableStatus) => {
    try {
      const currentItem = historyItems.find(item => item.id === itemId)
      const currentStatusDates = currentItem?.status_dates || {}
      const isTransitioningFromComplete = currentItem?.status === 'complete' || currentItem?.status === 'failed'
      
      // Update the status date for the new status
      const updatedStatusDates = {
        ...currentStatusDates,
        [newStatus]: new Date().toISOString(),
      }

      // If transitioning from complete/failed and no tailored date exists, set it
      if (isTransitioningFromComplete && !updatedStatusDates.tailored) {
        updatedStatusDates.tailored = new Date().toISOString()
      }

      const updatedItem = await updateHistoryItem(itemId, { 
        status: newStatus,
        status_dates: updatedStatusDates
      })
      setHistoryItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      )
    } catch (error) {
      console.error('Failed to update status:', error)
      // Optionally show an error toast here
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatStatusDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusHistory = (item: HistoryItem) => {
    if (!item.status_dates) return []
    
    // Define the order we want to show statuses
    const statusOrder: EditableStatus[] = ['tailored', 'applied', 'interviewing', 'rejected', 'ghosted', 'hired']
    
    return statusOrder
      .filter(status => item.status_dates?.[status])
      .map(status => ({
        status,
        date: item.status_dates![status]!,
        label: statusConfig[status].label
      }))
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Resume History</h1>
        <p className="text-slate-600 dark:text-slate-400">View and download your previously tailored resumes</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
            <History className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Loading History...</h3>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
            <History className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No History Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">Your tailored resumes will appear here once you create them.</p>
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {item.file_name}
                      </h3>
                      <StatusBadge 
                        status={item.status} 
                        itemId={item.id}
                        onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                      />
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p><strong>Job Title:</strong> {item.job_title}</p>
                      <p><strong>Company:</strong> {item.company}</p>
                      {item.original_resume_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          <strong>Original:</strong> {item.original_resume_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {formatDate(item.created_at)}</span>
                      </div>
                      {(() => {
                        const statusHistory = getStatusHistory(item)
                        if (statusHistory.length > 0) {
                          return (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Status History:</p>
                              <div className="space-y-1.5">
                                {statusHistory.map(({ status, date, label }) => {
                                  const config = statusConfig[status]
                                  const StatusIcon = config.icon
                                  return (
                                    <div key={status} className="flex items-center gap-2 text-xs">
                                      <StatusIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                      <span className="text-slate-600 dark:text-slate-400">
                                        <strong>{label}:</strong> {formatStatusDate(date)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Button
                    variant="outline"
                    onClick={() => item.download_url && window.open(item.download_url, '_blank')}
                    disabled={!item.download_url || (item.status === 'tailoring' || item.status === 'failed')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
