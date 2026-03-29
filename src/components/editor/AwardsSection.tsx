import { Trophy, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { AwardEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface AwardsSectionProps {
  ops: ArrayFieldOps<AwardEntry>
  expanded: boolean
  onToggle: () => void
}

export function AwardsSection({
  ops,
  expanded,
  onToggle,
}: AwardsSectionProps) {
  return (
    <SectionWrapper
      icon={<Trophy className="h-5 w-5 text-amber-600" />}
      title="Awards & Honors"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ title: '' })}
        >
          <Plus className="h-4 w-4" />
          Add Award
        </Button>
      }
    >
      <div className="space-y-4">
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No awards yet. Click &quot;Add Award&quot; to get started.
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
                <Label>Award Title</Label>
                <Input
                  value={entry.title}
                  onChange={(e) =>
                    ops.updateItem(index, 'title', e.target.value)
                  }
                  placeholder="Award Name"
                />
              </div>
              <div>
                <Label>Awarder</Label>
                <Input
                  value={entry.awarder || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'awarder', e.target.value)
                  }
                  placeholder="Awarding Organization"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={entry.date || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'date', e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea
                  value={entry.summary || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'summary', e.target.value)
                  }
                  placeholder="Brief description of the award..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
