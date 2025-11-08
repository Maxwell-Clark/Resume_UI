import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { History, Download, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHistoryItems, type HistoryItem } from '@/lib/history'

export function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Load history from API
    const loadHistory = async () => {
      setIsLoading(true)
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
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Resume History</h1>
        <p className="text-slate-600">View and download your previously tailored resumes</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <History className="h-16 w-16 text-slate-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading History...</h3>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <History className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No History Yet</h3>
            <p className="text-slate-600">Your tailored resumes will appear here once you create them.</p>
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {item.file_name}
                    </h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p><strong>Job Title:</strong> {item.job_title}</p>
                      <p><strong>Company:</strong> {item.company}</p>
                      {item.original_resume_name && (
                        <p className="text-xs text-slate-500">
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
                    onClick={() => window.open(item.download_url, '_blank')}
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
