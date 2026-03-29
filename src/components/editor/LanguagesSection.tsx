import { Languages, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { LanguageEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface LanguagesSectionProps {
  ops: ArrayFieldOps<LanguageEntry>
  expanded: boolean
  onToggle: () => void
}

export function LanguagesSection({
  ops,
  expanded,
  onToggle,
}: LanguagesSectionProps) {
  return (
    <SectionWrapper
      icon={<Languages className="h-5 w-5 text-teal-600" />}
      title="Languages"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ language: '' })}
        >
          <Plus className="h-4 w-4" />
          Add Language
        </Button>
      }
    >
      <div className="space-y-4">
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No languages yet. Click &quot;Add Language&quot; to get started.
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
                <Label>Language</Label>
                <Input
                  value={entry.language}
                  onChange={(e) =>
                    ops.updateItem(index, 'language', e.target.value)
                  }
                  placeholder="e.g. English"
                />
              </div>
              <div>
                <Label>Fluency</Label>
                <Input
                  value={entry.fluency || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'fluency', e.target.value)
                  }
                  placeholder="e.g. Native, Fluent, Intermediate"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
