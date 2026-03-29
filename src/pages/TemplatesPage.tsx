import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TemplateCard } from '@/components/TemplateCard'
import { TemplatePreviewDialog } from '@/components/TemplatePreviewDialog'
import { useTemplate } from '@/contexts/TemplateContext'
import { TEMPLATES } from '@/data/templates'
import { TEMPLATE_CATEGORIES } from '@/types/template'
import type { ResumeTemplate, TemplateCategory } from '@/types/template'

export function TemplatesPage() {
  const { selectedTemplateId, setSelectedTemplateId } = useTemplate()
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const filteredTemplates =
    activeCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory)

  const handlePreview = (template: ResumeTemplate) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Resume Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a template to customize how your resume looks when exported or tailored.
        </p>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Template grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={setSelectedTemplateId}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-sm text-muted-foreground">No templates found in this category.</p>
        </div>
      )}

      {/* Preview dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        isSelected={previewTemplate?.id === selectedTemplateId}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSelect={setSelectedTemplateId}
      />
    </div>
  )
}
