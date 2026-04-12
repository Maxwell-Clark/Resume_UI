import { useMemo } from 'react'
import { CheckCircle, Send, MessageSquare, Trophy, Ban } from 'lucide-react'
import { History } from 'lucide-react'
import type { HistoryItem } from '@/lib/history'
import { KanbanColumn, type BoardColumn } from '@/components/kanban/KanbanColumn'

const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: 'tailored',
    title: 'Tailored',
    statuses: ['tailored', 'complete', 'tailoring', 'failed'],
    dropStatus: 'tailored',
    icon: CheckCircle,
    color: 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'applied',
    title: 'Applied',
    statuses: ['applied'],
    dropStatus: 'applied',
    icon: Send,
    color: 'bg-purple-100/80 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'interviewing',
    title: 'Interviewing',
    statuses: ['interviewing'],
    dropStatus: 'interviewing',
    icon: MessageSquare,
    color: 'bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hired',
    title: 'Hired',
    statuses: ['hired'],
    dropStatus: 'hired',
    icon: Trophy,
    color: 'bg-green-100/80 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  {
    id: 'closed',
    title: 'Rejected / Ghosted',
    statuses: ['rejected', 'ghosted'],
    dropStatus: 'rejected',
    icon: Ban,
    color: 'bg-red-100/80 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  },
]

interface KanbanBoardProps {
  items: HistoryItem[]
  onStatusChange: (itemId: string, newStatus: BoardColumn['dropStatus']) => void
  onOpenDetailModal: (item: HistoryItem) => void
  onToggleFavorite: (itemId: string, currentFavorited: boolean) => void
  isLoading: boolean
}

export function KanbanBoard({ items, onStatusChange, onOpenDetailModal, onToggleFavorite, isLoading }: KanbanBoardProps) {
  const columnItems = useMemo(() => {
    const grouped = new Map<string, HistoryItem[]>()
    BOARD_COLUMNS.forEach(col => grouped.set(col.id, []))

    items.forEach(item => {
      const column = BOARD_COLUMNS.find(col => col.statuses.includes(item.status))
      if (column) {
        grouped.get(column.id)!.push(item)
      }
    })

    // Sort each column: favorites first, then by date descending
    grouped.forEach((colItems, key) => {
      grouped.set(key, [...colItems].sort((a, b) => {
        if (a.favorited !== b.favorited) return b.favorited ? 1 : -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }))
    })

    return grouped
  }, [items])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <History className="h-16 w-16 text-slate-400 dark:text-slate-500 animate-pulse" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 text-center">
        <History className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Items</h3>
        <p className="text-slate-600 dark:text-slate-400">No resumes match your current filters.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      {BOARD_COLUMNS.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          items={columnItems.get(column.id) || []}
          onStatusChange={onStatusChange}
          onOpenDetailModal={onOpenDetailModal}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
