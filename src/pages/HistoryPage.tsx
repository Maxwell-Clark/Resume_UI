import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { History, Download, FileText, Calendar, Loader2, CheckCircle, XCircle, ChevronDown, Send, MessageSquare, Ban, UserX, Trophy, Edit, Trash2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover } from '@/components/ui/popover'
import { ConfirmationDialog } from '@/components/ui/dialog'
import { getHistoryItems, updateHistoryItem, deleteHistoryItem, saveHistoryCache, loadHistoryCache, type HistoryItem } from '@/lib/history'
import { resumeService } from '@/services/resume'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/contexts/NotificationContext'

const ITEMS_PER_PAGE = 20
const CACHE_BATCH_SIZE = 50

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
      wrapInButton={false}
      trigger={
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
            config.style
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
          <ChevronDown className="h-3 w-3" />
        </span>
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

// All possible statuses for filtering
const allStatuses: HistoryItem['status'][] = ['tailoring', 'tailored', 'applied', 'interviewing', 'rejected', 'ghosted', 'hired', 'complete', 'failed']

export function HistoryPage() {
  const [cachedRanges, setCachedRanges] = useState<Map<string, HistoryItem[]>>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<HistoryItem['status'] | 'all'>('all')
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const cachedRangesRef = useRef<Map<string, HistoryItem[]>>(new Map())
  const { addNotification } = useNotifications()
  const notifiedItemsRef = useRef<Set<string>>(new Set())

  // Get cache key for a range
  const getCacheKey = (offset: number, limit: number) => `${offset}-${offset + limit - 1}`
  
  // Keep ref in sync with state
  useEffect(() => {
    cachedRangesRef.current = cachedRanges
  }, [cachedRanges])

  // Get all cached items sorted by index
  const getAllCachedItems = useMemo(() => {
    const items: HistoryItem[] = []
    const ranges = Array.from(cachedRanges.entries())
      .map(([key, items]) => {
        const [start] = key.split('-').map(Number)
        return { start, items }
      })
      .sort((a, b) => a.start - b.start)
    
    ranges.forEach(({ items: rangeItems }) => {
      items.push(...rangeItems)
    })
    
    return items
  }, [cachedRanges])

  // Filter items by search query and status
  const filteredItems = useMemo(() => {
    let items = getAllCachedItems
    
    // Filter by search query (searches file_name, job_title, company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      items = items.filter(item => 
        item.file_name?.toLowerCase().includes(query) ||
        item.job_title?.toLowerCase().includes(query) ||
        item.company?.toLowerCase().includes(query)
      )
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      items = items.filter(item => item.status === statusFilter)
    }
    
    return items
  }, [getAllCachedItems, searchQuery, statusFilter])

  // Get items for current page (from filtered items)
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage])

  // Calculate total pages based on filtered items
  const totalPages = useMemo(() => {
    const totalItems = filteredItems.length
    // When filtering, use exact count
    if (searchQuery.trim() || statusFilter !== 'all') {
      return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
    }
    // When not filtering, check if there might be more items
    if (hasMoreItems && getAllCachedItems.length > 0 && getAllCachedItems.length % CACHE_BATCH_SIZE === 0) {
      return Math.ceil((getAllCachedItems.length + ITEMS_PER_PAGE) / ITEMS_PER_PAGE)
    }
    return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  }, [filteredItems.length, getAllCachedItems.length, hasMoreItems, searchQuery, statusFilter])

  // Fetch a batch of items
  const fetchBatch = useCallback(async (offset: number, limit: number = CACHE_BATCH_SIZE) => {
    const items = await getHistoryItems(offset, limit)
    const cacheKey = getCacheKey(offset, limit)
    
    setCachedRanges(prev => {
      const newMap = new Map(prev)
      newMap.set(cacheKey, items)
      // Persist to localStorage
      saveHistoryCache(newMap)
      return newMap
    })
    
    // If we got fewer items than requested, we've reached the end
    if (items.length < limit) {
      setHasMoreItems(false)
    }
    
    return items
  }, [])

  // Fetch batch if needed for current page
  const ensureBatchForPage = useCallback(async (page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    
    // Calculate which batch ranges we need
    const neededRanges: number[] = []
    for (let i = startIndex; i < endIndex; i++) {
      const batchStart = Math.floor(i / CACHE_BATCH_SIZE) * CACHE_BATCH_SIZE
      if (!neededRanges.includes(batchStart)) {
        neededRanges.push(batchStart)
      }
    }
    
    // Fetch any missing ranges
    let hasLoading = false
    const fetchPromises = neededRanges.map(async (offset) => {
      const cacheKey = getCacheKey(offset, CACHE_BATCH_SIZE)
      if (!cachedRangesRef.current.has(cacheKey)) {
        if (!hasLoading) {
          hasLoading = true
          setIsLoadingMore(true)
        }
        try {
          await fetchBatch(offset, CACHE_BATCH_SIZE)
        } finally {
          // Only set loading to false if this was the last promise
        }
      }
    })
    
    await Promise.all(fetchPromises)
    if (hasLoading) {
      setIsLoadingMore(false)
    }
  }, [fetchBatch])

  // Initial load - check cache first, then fetch if needed
  const loadInitialHistory = useCallback(async (forceRefresh = false) => {
    try {
      // If force refresh, skip cache and fetch directly
      if (forceRefresh) {
        setIsLoading(true)
        await fetchBatch(0, CACHE_BATCH_SIZE)
        setIsLoading(false)
        return
      }

      // Load from cache first
      const cached = loadHistoryCache()
      if (cached && cached.size > 0) {
        setCachedRanges(cached)
        setIsLoading(false)
        // Still fetch in background to get latest data, but don't show loading
        fetchBatch(0, CACHE_BATCH_SIZE).catch(err => {
          console.error('Failed to refresh history:', err)
        })
      } else {
        // No cache, fetch from API
        setIsLoading(true)
        await fetchBatch(0, CACHE_BATCH_SIZE)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      setIsLoading(false)
    }
  }, [fetchBatch])

  useEffect(() => {
    // Check if navigation state has forceRefresh flag or if there's a pending tailoring ID
    const navState = location.state as any
    const pendingId = localStorage.getItem('pending_tailoring_id')
    const forceRefresh = navState?.forceRefresh === true || !!pendingId
    loadInitialHistory(forceRefresh)
    // Clear navigation state after using it to prevent re-triggering
    if (navState?.forceRefresh) {
      window.history.replaceState({}, '', location.pathname)
    }
  }, [loadInitialHistory, location.pathname, location.state])

  // Poll for status updates on items with 'tailoring' status
  useEffect(() => {
    // Check for pending tailoring ID from localStorage
    const pendingId = localStorage.getItem('pending_tailoring_id')
    const tailoringItems = getAllCachedItems.filter(item => item.status === 'tailoring')
    const shouldPoll = tailoringItems.length > 0 || !!pendingId
    
    if (!shouldPoll) return

    // Track which items were tailoring when polling started
    const previousTailoringIds = new Set(tailoringItems.map(item => item.id))

    const pollInterval = setInterval(async () => {
      // Get fresh pending ID on each poll
      const currentPendingId = localStorage.getItem('pending_tailoring_id')
      try {
        const fetchedItems = await fetchBatch(0, CACHE_BATCH_SIZE)
        
        // Get current state of all items
        const allItems = Array.from(cachedRangesRef.current.values()).flat()
        
        // Check if pending item is now complete and clear it
        if (currentPendingId) {
          const pendingItem = allItems.find(item => item.id === currentPendingId) || fetchedItems.find(item => item.id === currentPendingId)
          if (pendingItem && pendingItem.status !== 'tailoring') {
            // Item is no longer tailoring, clear the pending ID
            localStorage.removeItem('pending_tailoring_id')
            
            // Show notification if status is complete and we haven't notified yet
            if (pendingItem.status === 'complete' && !notifiedItemsRef.current.has(pendingItem.id)) {
              notifiedItemsRef.current.add(pendingItem.id)
              addNotification({
                title: 'Tailoring Complete',
                message: `${pendingItem.file_name} is ready for download.`,
                type: 'success'
              })
            }
          }
        }
        
        // Check all items that were previously tailoring to see if any changed to complete
        allItems.forEach(item => {
          if (item.status === 'complete' && !notifiedItemsRef.current.has(item.id) && previousTailoringIds.has(item.id)) {
            notifiedItemsRef.current.add(item.id)
            addNotification({
              title: 'Tailoring Complete',
              message: `${item.file_name} is ready for download.`,
              type: 'success'
            })
          }
        })
      } catch (err) {
        console.error('Failed to poll for status updates:', err)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [getAllCachedItems, fetchBatch, addNotification])

  // Ensure we have the batch for current page
  useEffect(() => {
    if (!isLoading && currentPageItems.length === 0 && hasMoreItems) {
      ensureBatchForPage(currentPage)
    }
  }, [currentPage, isLoading, currentPageItems.length, hasMoreItems, ensureBatchForPage])

  // Persist cache to localStorage whenever cachedRanges changes
  useEffect(() => {
    if (cachedRanges.size > 0) {
      saveHistoryCache(cachedRanges)
    }
  }, [cachedRanges])

  const handleStatusChange = async (itemId: string, newStatus: EditableStatus) => {
    try {
      const currentItem = getAllCachedItems.find(item => item.id === itemId)
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

      // Update in all cached ranges
      setCachedRanges(prev => {
        const newMap = new Map(prev)
        newMap.forEach((items, key) => {
          const updatedItems = items.map(item => 
            item.id === itemId 
              ? { ...item, status: newStatus, status_dates: updatedStatusDates }
              : item
          )
          newMap.set(key, updatedItems)
        })
        return newMap
      })

      await updateHistoryItem(itemId, { 
        status: newStatus,
        status_dates: updatedStatusDates
      })

    } catch (error) {
      console.error('Failed to update status:', error)
      // Optionally show an error toast here
    }
  }

  const handleEdit = async (item: HistoryItem) => {
    // If we have a resume_id, navigate directly to it
    if (item.resume_id) {
      navigate(`/editor/${item.resume_id}`)
      return
    }

    // Fallback: Try to fetch from download_url if no resume_id exists
    // NOTE: This will fail if download_url points to a PDF
    if (!item.download_url) return

    try {
      setImportingId(item.id)
      
      // Fetch the content from the download URL
      const response = await fetch(item.download_url)
      if (!response.ok) throw new Error('Failed to fetch resume content')
      
      // Check content type to avoid parsing PDF as JSON
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Cannot edit this resume: Source file is not JSON')
      }

      const content = await response.json()
      
      // Create a new resume entry in the database
      const newResume = await resumeService.createResume({
        name: `${item.file_name} (Edited)`,
        content
      })
      
      // Navigate to the editor with the new resume ID
      navigate(`/editor/${newResume.id}`)
    } catch (error) {
      console.error('Failed to import resume for editing:', error)
      alert(error instanceof Error ? error.message : 'Failed to import resume for editing')
    } finally {
      setImportingId(null)
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

  const handleDeleteClick = (item: HistoryItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      setDeletingId(itemToDelete.id)
      await deleteHistoryItem(itemToDelete.id)
      
      // Remove from all cached ranges
      setCachedRanges(prev => {
        const newMap = new Map(prev)
        newMap.forEach((items, key) => {
          const filteredItems = items.filter(i => i.id !== itemToDelete.id)
          if (filteredItems.length > 0) {
            newMap.set(key, filteredItems)
          } else {
            newMap.delete(key)
          }
        })
        return newMap
      })
      
      // Adjust current page if needed
      if (currentPageItems.length === 0 && currentPage > 1) {
        setCurrentPage(prev => Math.max(1, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete history item:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete history item')
    } finally {
      setDeletingId(null)
      setItemToDelete(null)
    }
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    
    setCurrentPage(newPage)
    await ensureBatchForPage(newPage)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Resume History</h1>
        <p className="text-slate-600 dark:text-slate-400">View and download your previously tailored resumes</p>
      </div>

      {/* Search and Filter Controls */}
      {!isLoading && getAllCachedItems.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, job title, or company..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Popover
            open={statusFilterOpen}
            onOpenChange={setStatusFilterOpen}
            wrapInButton={false}
            trigger={
              <Button variant="outline" className="flex items-center min-w-[160px] justify-between">
                {statusFilter === 'all' ? (
                  <span className="text-slate-500 dark:text-slate-400">All Statuses</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {(() => {
                      const config = statusConfig[statusFilter]
                      const Icon = config.icon
                      return (
                        <>
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </>
                      )
                    })()}
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            }
            align="end"
            side="bottom"
          >
            <div className="p-1 min-w-[180px]">
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setStatusFilterOpen(false)
                  setCurrentPage(1)
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                  statusFilter === 'all' && 'bg-slate-100 dark:bg-slate-700'
                )}
              >
                <span>All Statuses</span>
                {statusFilter === 'all' && <CheckCircle className="h-4 w-4 ml-auto" />}
              </button>
              {allStatuses.map((status) => {
                const config = statusConfig[status]
                const Icon = config.icon
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setStatusFilterOpen(false)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                      statusFilter === status && 'bg-slate-100 dark:bg-slate-700'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                    {statusFilter === status && <CheckCircle className="h-4 w-4 ml-auto" />}
                  </button>
                )
              })}
            </div>
          </Popover>
        </div>
      )}

      {/* Results count when filtering */}
      {!isLoading && (searchQuery.trim() || statusFilter !== 'all') && filteredItems.length > 0 && (
        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
          {searchQuery.trim() && <span> for "<strong>{searchQuery}</strong>"</span>}
          {statusFilter !== 'all' && <span> with status <strong>{statusConfig[statusFilter].label}</strong></span>}
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
            <History className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Loading History...</h3>
          </div>
        ) : getAllCachedItems.length === 0 && !isLoadingMore ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
            <History className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No History Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">Your tailored resumes will appear here once you create them.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
            <Search className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Results Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No resumes match your search{statusFilter !== 'all' ? ' and filter' : ''} criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {currentPageItems.map((item) => (
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
                <div className="ml-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    disabled={(!item.download_url && !item.resume_id) || importingId === item.id || (item.status === 'tailoring' || item.status === 'failed')}
                    className="flex items-center gap-2 w-full justify-start"
                  >
                    {importingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => item.download_url && window.open(item.download_url, '_blank')}
                    disabled={!item.download_url || (item.status === 'tailoring' || item.status === 'failed')}
                    className="flex items-center gap-2 w-full justify-start"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteClick(item)}
                    disabled={deletingId === item.id}
                    className="flex items-center gap-2 w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoadingMore}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoadingMore}
                        className="min-w-[2.5rem]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoadingMore || !hasMoreItems}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {isLoadingMore && (
              <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                Loading more items...
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Resume"
        description={itemToDelete ? `Are you sure you want to delete "${itemToDelete.file_name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}
