import { GraduationCap, Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProButton } from '@/components/ProFeatureGate'
import { SectionWrapper } from './SectionWrapper'
import type { EducationEntry } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface EducationSectionProps {
  ops: ArrayFieldOps<EducationEntry>
  expanded: boolean
  onToggle: () => void
  onAIEdit: (
    type: 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight',
    fieldLabel: string,
    currentText: string,
    workIndex?: number,
    highlightIndex?: number,
    educationIndex?: number,
    detailIndex?: number
  ) => void
  templateHint?: string | null
}

export function EducationSection({
  ops,
  expanded,
  onToggle,
  onAIEdit,
  templateHint,
}: EducationSectionProps) {
  return (
    <SectionWrapper
      icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
      title="Education"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            ops.addItem({ institution: '', details: [] })
          }
        >
          <Plus className="h-4 w-4" />
          Add Education
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
            No education yet. Click &quot;Add Education&quot; to get started.
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
                <Label>Institution</Label>
                <Input
                  value={entry.institution}
                  onChange={(e) =>
                    ops.updateItem(index, 'institution', e.target.value)
                  }
                  placeholder="University Name"
                />
              </div>
              <div>
                <Label>Degree Type</Label>
                <Input
                  value={entry.studyType || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'studyType', e.target.value)
                  }
                  placeholder="Bachelor of Science"
                />
              </div>
              <div>
                <Label>Area of Study</Label>
                <Input
                  value={entry.area || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'area', e.target.value)
                  }
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <Label>GPA</Label>
                <Input
                  value={entry.gpa || ''}
                  onChange={(e) =>
                    ops.updateItem(index, 'gpa', e.target.value)
                  }
                  placeholder="3.8"
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
              <div className="flex items-center justify-between mb-2">
                <Label>Details</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ops.addNested(index, 'details')}
                >
                  <Plus className="h-4 w-4" />
                  Add Detail
                </Button>
              </div>
              <div className="space-y-2">
                {entry.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2">
                    <Textarea
                      value={detail}
                      onChange={(e) =>
                        ops.updateNested(
                          index,
                          'details',
                          dIdx,
                          e.target.value
                        )
                      }
                      placeholder="Relevant coursework, honors, activities..."
                      rows={2}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <ProButton
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          onAIEdit(
                            'education_detail',
                            `Education Detail #${dIdx + 1}`,
                            detail,
                            undefined,
                            undefined,
                            index,
                            dIdx
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
                          ops.removeNested(index, 'details', dIdx)
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
