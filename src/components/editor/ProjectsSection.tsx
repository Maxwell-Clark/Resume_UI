import { FolderKanban, Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProButton } from '@/components/ProFeatureGate'
import { SectionWrapper } from './SectionWrapper'
import type { ProjectEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface ProjectsSectionProps {
  ops: ArrayFieldOps<ProjectEntry>
  expanded: boolean
  onToggle: () => void
  onAIEdit: (
    type: 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight',
    fieldLabel: string,
    currentText: string,
    workIndex?: number,
    highlightIndex?: number,
    educationIndex?: number,
    detailIndex?: number,
    projectIndex?: number
  ) => void
}

export function ProjectsSection({
  ops,
  expanded,
  onToggle,
  onAIEdit,
}: ProjectsSectionProps) {
  return (
    <SectionWrapper
      icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
      title="Projects"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ name: '', highlights: [] })}
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      }
    >
      <div className="space-y-4">
        {ops.items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No projects yet. Click &quot;Add Project&quot; to get started.
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
                <Label>Project Name</Label>
                <Input
                  value={entry.name}
                  onChange={(e) =>
                    ops.updateItem(index, 'name', e.target.value)
                  }
                  placeholder="Project Name"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={entry.url || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'url', e.target.value)
                  }
                  placeholder="https://github.com/..."
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
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <ProButton
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onAIEdit(
                      'project_description',
                      `Project Description (#${index + 1})`,
                      entry.description || '',
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      index
                    )
                  }
                  featureName="AI Edit"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Edit
                </ProButton>
              </div>
              <Textarea
                value={entry.description || ''}
                onChange={(e) =>
                  ops.updateItem(index, 'description', e.target.value)
                }
                placeholder="Brief description of the project..."
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
                  <div key={hIdx} className="flex items-start gap-2">
                    <Textarea
                      value={highlight}
                      onChange={(e) =>
                        ops.updateNested(
                          index,
                          'highlights',
                          hIdx,
                          e.target.value
                        )
                      }
                      placeholder="Describe a key feature or achievement..."
                      rows={2}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <ProButton
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          onAIEdit(
                            'project_highlight',
                            `Project Highlight #${hIdx + 1}`,
                            highlight,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            index
                          )
                        }
                        featureName="AI Edit"
                      >
                        <Sparkles className="h-4 w-4" />
                      </ProButton>
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
