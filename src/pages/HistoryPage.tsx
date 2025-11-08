import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { History, Download, FileText, Calendar, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHistoryItems, type HistoryItem } from '@/lib/history'
import { cn } from '@/lib/utils'

const StatusBadge = ({ status }: { status: HistoryItem['status'] }) => {
  const styles = {
    tailoring: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    complete: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    failed: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  }

  const icons = {
    tailoring: Loader2,
    complete: CheckCircle,
    failed: XCircle,
  }

  const labels = {
    tailoring: 'Tailoring',
    complete: 'Complete',
    failed: 'Failed',
  }

  const Icon = icons[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'tailoring' && 'animate-spin')} />
      {labels[status]}
    </span>
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
                      <StatusBadge status={item.status} />
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
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Button
                    variant="outline"
                    onClick={() => item.download_url && window.open(item.download_url, '_blank')}
                    disabled={!item.download_url || item.status !== 'complete'}
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
