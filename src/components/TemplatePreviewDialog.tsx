import { useState } from 'react'
import { Check, Crown } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradeModal } from '@/components/UpgradeModal'
import type { ResumeTemplate } from '@/types/template'

interface TemplatePreviewDialogProps {
  template: ResumeTemplate | null
  isSelected: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: string) => void
}

export function TemplatePreviewDialog({
  template,
  isSelected,
  open,
  onOpenChange,
  onSelect,
}: TemplatePreviewDialogProps) {
  const { isPro } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  if (!template) return null

  const isLocked = template.isPro && !isPro

  const handleSelect = () => {
    if (isLocked) {
      setUpgradeOpen(true)
    } else {
      onSelect(template.id)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={template.name}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Preview image */}
          <div className="relative aspect-[8.5/11] overflow-hidden rounded-lg border bg-muted">
            <img
              src={template.thumbnail}
              alt={`${template.name} template preview`}
              className="h-full w-full object-cover"
            />
            {template.isPro && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
                <Crown className="h-3 w-3" />
                PRO
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-sm text-muted-foreground">{template.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSelect} disabled={isSelected}>
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Selected
                </>
              ) : isLocked ? (
                <>
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade to Use
                </>
              ) : (
                'Select Template'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName={`${template.name} template`}
        featureDescription="Unlock premium resume templates designed to make your application stand out."
      />
    </>
  )
}
