import { useEffect, useRef } from 'react'
import { getHistoryItemById, type HistoryItem } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'

const POLL_INTERVAL_MS = 10_000
const MAX_POLL_COUNT = 60 // 10 minutes at 10s intervals

export function useJobStatusPolling(historyId: string | null, onComplete: (item: HistoryItem) => void) {
  const { addNotification } = useNotifications()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasNotifiedRef = useRef(false)
  const pollCountRef = useRef(0)

  useEffect(() => {
    if (!historyId) return

    pollCountRef.current = 0

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }

    const pollStatus = async () => {
      pollCountRef.current++

      if (pollCountRef.current > MAX_POLL_COUNT) {
        console.warn(`Polling timed out after ${MAX_POLL_COUNT} attempts for history item ${historyId}`)
        stopPolling()
        localStorage.removeItem('pending_tailoring_id')
        addNotification({
          title: 'Tailoring Timed Out',
          message: 'The tailoring process is taking longer than expected. Check the history page for updates.',
          type: 'error',
        })
        return
      }

      try {
        const item = await getHistoryItemById(historyId)
        if (!item) return

        if (item.status === 'complete' && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          localStorage.removeItem('pending_tailoring_id')
          addNotification({
            title: 'Resume Tailoring Complete!',
            message: `${item.file_name} is ready for download.`,
            type: 'success',
          })
          onComplete(item)
          stopPolling()
        } else if (item.status === 'failed' && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true
          localStorage.removeItem('pending_tailoring_id')
          addNotification({
            title: 'Resume Tailoring Failed',
            message: `Failed to tailor ${item.file_name}. Please try again.`,
            type: 'error',
          })
          stopPolling()
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }

    pollingIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS)

    // Initial check
    pollStatus()

    return () => stopPolling()
  }, [historyId, addNotification, onComplete])
}
