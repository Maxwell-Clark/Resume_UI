import { useState } from 'react'
import { ChevronDown, Crown, Check } from 'lucide-react'
import { Popover } from '@/components/ui/popover'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradeModal } from '@/components/UpgradeModal'
import { TEMPLATES } from '@/data/templates'
import { cn } from '@/lib/utils'

interface TemplatePickerProps {
  selectedTemplateId: string
  onSelect: (id: string) => void
}

export function TemplatePicker({ selectedTemplateId, onSelect }: TemplatePickerProps) {
  const { isPro } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const selected = TEMPLATES.find(t => t.id === selectedTemplateId) ?? TEMPLATES[0]

  const handleSelect = (id: string) => {
    const template = TEMPLATES.find(t => t.id === id)
    if (template?.isPro && !isPro) {
      setUpgradeOpen(true)
      return
    }
    onSelect(id)
  }

  return (
    <>
      <Popover
        align="start"
        side="bottom"
        sideOffset={4}
        contentClassName="w-72 p-2"
        trigger={
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="hidden sm:inline text-xs text-muted-foreground/70">Template:</span>
            <span className="font-medium text-foreground">{selected.name}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        }
      >
        <div className="space-y-1">
          {TEMPLATES.map((template) => {
            const isSelected = template.id === selectedTemplateId
            const isLocked = template.isPro && !isPro
            return (
              <button
                key={template.id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                  'hover:bg-accent',
                  isSelected && 'bg-accent'
                )}
                onClick={() => handleSelect(template.id)}
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className={cn(
                    'h-12 w-9 rounded border object-cover bg-white',
                    isLocked && 'opacity-50'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('font-medium truncate', isLocked && 'text-muted-foreground')}>
                      {template.name}
                    </span>
                    {template.isPro && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        <Crown className="h-2.5 w-2.5" />
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </Popover>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="Premium templates"
        featureDescription="Unlock premium resume templates to make your application stand out."
      />
    </>
  )
}
