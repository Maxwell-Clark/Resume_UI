import {
  Pencil,
  Check,
  X,
  Eye,
  Download,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TemplatePicker } from './TemplatePicker'

interface EditorToolbarProps {
  resumeName: string
  displayName: string
  isEditingName: boolean
  editingNameValue: string
  setEditingNameValue: (value: string) => void
  onStartEditName: () => void
  onFinishEditName: () => void
  onCancelEditName: () => void
  downloadUrl?: string
  onPreview: () => void
  onDownload: () => void
  onSave: () => void
  saving: boolean
  selectedTemplateId: string
  onTemplateChange: (id: string) => void
}

export function EditorToolbar({
  displayName,
  isEditingName,
  editingNameValue,
  setEditingNameValue,
  onStartEditName,
  onFinishEditName,
  onCancelEditName,
  onPreview,
  onDownload,
  onSave,
  saving,
  selectedTemplateId,
  onTemplateChange,
}: EditorToolbarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingNameValue}
                onChange={(e) => setEditingNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onFinishEditName()
                  if (e.key === 'Escape') onCancelEditName()
                }}
                className="max-w-xs"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={onFinishEditName}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onCancelEditName}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                {displayName}
              </h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={onStartEditName}
                className="shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TemplatePicker
            selectedTemplateId={selectedTemplateId}
            onSelect={onTemplateChange}
          />
          <div className="h-5 w-px bg-border hidden sm:block" />
          <Button size="sm" variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {saving ? 'Saving...' : 'Save Changes'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
