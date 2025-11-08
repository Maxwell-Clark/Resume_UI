import { useEffect, useRef } from 'react'
import { getHistoryItemById, type HistoryItem } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'

export function useJobStatusPolling(historyId: string | null, onComplete: (item: HistoryItem) => void) {
  const { addNotification } = useNotifications()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    if (!historyId) return

    const pollStatus = async () => {
      try {
        const item = await getHistoryItemById(historyId)
        if (!item) return

        if (item.status === 'complete' && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          addNotification({
            title: 'Resume Tailoring Complete!',
            message: `${item.file_name} is ready for download.`,
            type: 'success',
          })
          onComplete(item)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else if (item.status === 'failed' && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          addNotification({
            title: 'Resume Tailoring Failed',
            message: `Failed to tailor ${item.file_name}. Please try again.`,
            type: 'error',
          })
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 3000)
    
    // Initial check
    pollStatus()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [historyId, addNotification, onComplete])
}
