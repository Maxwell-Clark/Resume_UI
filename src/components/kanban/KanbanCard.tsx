import { Star, Loader2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HistoryItem } from '@/lib/history'

interface KanbanCardProps {
  item: HistoryItem
  onOpenDetailModal: (item: HistoryItem) => void
  onToggleFavorite: (itemId: string, currentFavorited: boolean) => void
  isDraggable: boolean
}

export function KanbanCard({ item, onOpenDetailModal, onToggleFavorite, isDraggable }: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.setData('application/x-source-status', item.status)
    e.dataTransfer.effectAllowed = 'move'
  }

  const formatDateCompact = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const matchPct = item.match_results?.match_percentage

  return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onClick={() => onOpenDetailModal(item)}
      className={cn(
        'group rounded-md border bg-white dark:bg-slate-800 p-3 shadow-sm transition-all',
        'hover:border-blue-300 dark:hover:border-blue-700',
        isDraggable && 'cursor-grab active:cursor-grabbing',
        !isDraggable && 'opacity-60 cursor-default'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          {isDraggable && (
            <GripVertical className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
            {item.job_title || item.file_name}
          </h4>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, item.favorited) }}
          className="flex-shrink-0"
        >
          <Star className={cn(
            'h-3.5 w-3.5 transition-colors',
            item.favorited ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'
          )} />
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.company}</p>

      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-2">
          {matchPct != null && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {matchPct}%
            </span>
          )}
          {item.priority && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              item.priority === 'high' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              item.priority === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              item.priority === 'low' && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
            )}>
              {item.priority}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateCompact(item.created_at)}</span>
      </div>

      {item.status === 'tailoring' && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-600 dark:text-yellow-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Tailoring...
        </div>
      )}

      {item.status === 'failed' && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          Failed
        </div>
      )}
    </div>
  )
}
