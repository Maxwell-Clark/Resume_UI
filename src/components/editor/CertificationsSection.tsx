import { Award, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { CertificationEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface CertificationsSectionProps {
  ops: ArrayFieldOps<CertificationEntry>
  expanded: boolean
  onToggle: () => void
  templateHint?: string | null
}

export function CertificationsSection({
  ops,
  expanded,
  onToggle,
  templateHint,
}: CertificationsSectionProps) {
  return (
    <SectionWrapper
      icon={<Award className="h-5 w-5 text-yellow-600" />}
      title="Certifications"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ name: '' })}
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      }
    >
      <div className="space-y-4">
        {templateHint && (
          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            {templateHint}
          </div>
        )}
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No certifications yet. Click &quot;Add Certification&quot; to get
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

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Certification Name</Label>
                <Input
                  value={entry.name}
                  onChange={(e) =>
                    ops.updateItem(index, 'name', e.target.value)
                  }
                  placeholder="AWS Solutions Architect"
                />
              </div>
              <div>
                <Label>Issuer</Label>
                <Input
                  value={entry.issuer || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'issuer', e.target.value)
                  }
                  placeholder="Amazon Web Services"
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
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
