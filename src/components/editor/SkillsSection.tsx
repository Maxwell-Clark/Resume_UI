import { Code, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionWrapper } from './SectionWrapper'
import type { SkillCategory } from '@/types/resume'
import type { ArrayFieldOps } from '@/hooks/useArrayField'

interface SkillsSectionProps {
  ops: ArrayFieldOps<SkillCategory>
  expanded: boolean
  onToggle: () => void
  templateHint?: string | null
}

export function SkillsSection({ ops, expanded, onToggle, templateHint }: SkillsSectionProps) {
  return (
    <SectionWrapper
      icon={<Code className="h-5 w-5 text-orange-600" />}
      title="Skills"
      expanded={expanded}
      onToggle={onToggle}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => ops.addItem({ name: '', keywords: [] })}
        >
          <Plus className="h-4 w-4" />
          Add Category
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
            No skills yet. Click &quot;Add Category&quot; to get started.
          </p>
        )}
        {ops.items.map((category, index) => (
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

            <div>
              <Label>Category Name</Label>
              <Input
                value={category.name}
                onChange={(e) =>
                  ops.updateItem(index, 'name', e.target.value)
                }
                placeholder="e.g. Programming Languages"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Skills</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => ops.addNested(index, 'keywords')}
                >
                  <Plus className="h-4 w-4" />
                  Add Skill
                </Button>
              </div>
              <div className="space-y-2">
                {category.keywords.map((keyword, kIdx) => (
                  <div key={kIdx} className="flex items-center gap-2">
                    <Input
                      value={keyword}
                      onChange={(e) =>
                        ops.updateNested(
                          index,
                          'keywords',
                          kIdx,
                          e.target.value
                        )
                      }
                      placeholder="e.g. JavaScript"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        ops.removeNested(index, 'keywords', kIdx)
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
