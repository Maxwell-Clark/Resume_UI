import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { PublicationEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface PublicationsSectionProps {
  ops: ArrayFieldOps<PublicationEntry>
  expanded: boolean
  onToggle: () => void
}

export function PublicationsSection({
  ops,
  expanded,
  onToggle,
}: PublicationsSectionProps) {
  return (
    <SectionWrapper
      icon={<BookOpen className="h-5 w-5 text-cyan-600" />}
      title="Publications"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ name: '' })}
        >
          <Plus className="h-4 w-4" />
          Add Publication
        </Button>
      }
    >
      <div className="space-y-4">
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No publications yet. Click &quot;Add Publication&quot; to get
            started.
          </p>
        )}
        {ops.items.map((entry, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 sm:p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                #{index + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => ops.removeItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={entry.name}
                  onChange={(e) =>
                    ops.updateItem(index, 'name', e.target.value)
                  }
                  placeholder="Publication Title"
                />
              </div>
              <div>
                <Label>Publisher</Label>
                <Input
                  value={entry.publisher || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'publisher', e.target.value)
                  }
                  placeholder="Publisher Name"
                />
              </div>
              <div>
                <Label>Release Date</Label>
                <Input
                  type="date"
                  value={entry.releaseDate || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'releaseDate', e.target.value)
                  }
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={entry.url || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'url', e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label>Summary</Label>
              <Textarea
                value={entry.summary || ''}
                onChange={(e) =>
                  ops.updateItem(index, 'summary', e.target.value)
                }
                placeholder="Brief description of the publication..."
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
