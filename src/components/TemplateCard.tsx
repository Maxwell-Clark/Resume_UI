import { useState } from 'react'
import { Crown, Check, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradeModal } from '@/components/UpgradeModal'
import type { ResumeTemplate } from '@/types/template'

interface TemplateCardProps {
  template: ResumeTemplate
  isSelected: boolean
  onSelect: (id: string) => void
  onPreview: (template: ResumeTemplate) => void
}

export function TemplateCard({ template, isSelected, onSelect, onPreview }: TemplateCardProps) {
  const { isPro } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const isLocked = template.isPro && !isPro

  const handleClick = () => {
    if (isLocked) {
      setUpgradeOpen(true)
    } else {
      onSelect(template.id)
    }
  }

  return (
    <>
      <div
        className={cn(
          'group relative rounded-lg border bg-card transition-all duration-200 cursor-pointer',
          'hover:shadow-lg hover:scale-[1.02]',
          isSelected
            ? 'ring-2 ring-primary border-primary'
            : 'border-border hover:border-primary/50'
        )}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[8.5/11] overflow-hidden rounded-t-lg bg-muted">
          <img
            src={template.thumbnail}
            alt={`${template.name} template preview`}
            className={cn(
              'h-full w-full object-cover',
              isLocked && 'opacity-60'
            )}
          />

          {/* Selected badge */}
          {isSelected && (
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
              <Check className="h-3 w-3" />
              Selected
            </div>
          )}

          {/* Pro badge */}
          {template.isPro && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white">
              <Crown className="h-3 w-3" />
              PRO
            </div>
          )}

          {/* Preview button on hover */}
          <button
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onPreview(template)
            }}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-foreground">{template.name}</h3>
            <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName={`${template.name} template`}
        featureDescription="Unlock premium resume templates designed to make your application stand out."
      />
    </>
  )
}
