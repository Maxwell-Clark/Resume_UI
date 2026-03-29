import { Heart, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { VolunteerEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface VolunteerSectionProps {
  ops: ArrayFieldOps<VolunteerEntry>
  expanded: boolean
  onToggle: () => void
}

export function VolunteerSection({
  ops,
  expanded,
  onToggle,
}: VolunteerSectionProps) {
  return (
    <SectionWrapper
      icon={<Heart className="h-5 w-5 text-rose-600" />}
      title="Volunteer Experience"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            ops.addItem({ organization: '', highlights: [] })
          }
        >
          <Plus className="h-4 w-4" />
          Add Volunteer
        </Button>
      }
    >
      <div className="space-y-4">
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No volunteer experience yet. Click &quot;Add Volunteer&quot; to get
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
                <Label>Organization</Label>
                <Input
                  value={entry.organization}
                  onChange={(e) =>
                    ops.updateItem(index, 'organization', e.target.value)
                  }
                  placeholder="Organization Name"
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  value={entry.position || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'position', e.target.value)
                  }
                  placeholder="Volunteer Role"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={entry.startDate || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'startDate', e.target.value)
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={
                      entry.endDate === 'Present'
                        ? ''
                        : entry.endDate || ''
                    }
                    onChange={(e) =>
                      ops.updateItem(index, 'endDate', e.target.value)
                    }
                    disabled={entry.endDate === 'Present'}
                    className={
                      entry.endDate === 'Present' ? 'opacity-50' : ''
                    }
                  />
                  <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entry.endDate === 'Present'}
                      onChange={(e) =>
                        ops.updateItem(
                          index,
                          'endDate',
                          e.target.checked ? 'Present' : ''
                        )
                      }
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    Present
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label>Summary</Label>
              <Textarea
                value={entry.summary || ''}
                onChange={(e) =>
                  ops.updateItem(index, 'summary', e.target.value)
                }
                placeholder="Brief description of your volunteer work..."
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Highlights</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ops.addNested(index, 'highlights')}
                >
                  <Plus className="h-4 w-4" />
                  Add Highlight
                </Button>
              </div>
              <div className="space-y-2">
                {entry.highlights.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2">
                    <Input
                      value={highlight}
                      onChange={(e) =>
                        ops.updateNested(
                          index,
                          'highlights',
                          hIdx,
                          e.target.value
                        )
                      }
                      placeholder="Describe an accomplishment..."
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        ops.removeNested(index, 'highlights', hIdx)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
