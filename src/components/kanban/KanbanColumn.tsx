import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HistoryItem } from '@/lib/history'
import { KanbanCard } from '@/components/kanban/KanbanCard'

export interface BoardColumn {
  id: string
  title: string
  statuses: HistoryItem['status'][]
  dropStatus: 'tailored' | 'applied' | 'interviewing' | 'rejected' | 'ghosted' | 'hired'
  icon: LucideIcon
  color: string
}

interface KanbanColumnProps {
  column: BoardColumn
  items: HistoryItem[]
  onStatusChange: (itemId: string, newStatus: BoardColumn['dropStatus']) => void
  onOpenDetailModal: (item: HistoryItem) => void
  onToggleFavorite: (itemId: string, currentFavorited: boolean) => void
}

export function KanbanColumn({ column, items, onStatusChange, onOpenDetailModal, onToggleFavorite }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only fire when leaving the column itself, not child elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) {
      onStatusChange(itemId, column.dropStatus)
    }
  }

  const Icon = column.icon

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'min-w-[16rem] w-64 flex-shrink-0 flex flex-col rounded-lg border bg-slate-50/80 dark:bg-slate-900/50',
        'border-slate-200 dark:border-slate-700 transition-all',
        isDragOver && 'ring-2 ring-blue-400 border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
      )}
    >
      {/* Column header */}
      <div className={cn('px-3 py-2.5 border-b rounded-t-lg', column.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-semibold">{column.title}</span>
          </div>
          <span className="text-xs font-medium bg-white/60 dark:bg-black/20 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[8rem]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-md">
            Drop items here
          </div>
        ) : (
          items.map(item => (
            <KanbanCard
              key={item.id}
              item={item}
              onOpenDetailModal={onOpenDetailModal}
              onToggleFavorite={onToggleFavorite}
              isDraggable={item.status !== 'tailoring' && item.status !== 'failed'}
            />
          ))
        )}
      </div>
    </div>
  )
}
