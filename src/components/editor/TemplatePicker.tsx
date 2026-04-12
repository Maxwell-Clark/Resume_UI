import { useState } from 'react'
import { ChevronDown, Crown, Check, RotateCcw, Pipette } from 'lucide-react'
import { Popover } from '@/components/ui/popover'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useTemplate } from '@/contexts/TemplateContext'
import { UpgradeModal } from '@/components/UpgradeModal'
import { TEMPLATES } from '@/data/templates'
import { cn } from '@/lib/utils'

interface TemplatePickerProps {
  selectedTemplateId: string
  onSelect: (id: string) => void
}

export function TemplatePicker({ selectedTemplateId, onSelect }: TemplatePickerProps) {
  const { isPro } = useSubscription()
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, resetColors, selectedTemplate } = useTemplate()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const selected = TEMPLATES.find(t => t.id === selectedTemplateId) ?? TEMPLATES[0]

  const handleSelect = (id: string) => {
    const template = TEMPLATES.find(t => t.id === id)
    if (template?.isPro && !isPro) {
      setUpgradeOpen(true)
      return
    }
    onSelect(id)
  }

  const isDefaultColors = primaryColor === selectedTemplate.defaultPrimary && secondaryColor === selectedTemplate.defaultSecondary

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
            <span
              className="h-3 w-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: `#${primaryColor}` }}
            />
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

        {/* Color customization */}
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Colors</span>
            {!isDefaultColors && (
              <button
                type="button"
                onClick={resetColors}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedTemplate.presets.map((preset) => {
              const isActive = primaryColor === preset.primary && secondaryColor === preset.secondary
              return (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  className={cn(
                    'relative h-6 w-6 rounded-full border-2 transition-all',
                    isActive
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:border-muted-foreground/50 hover:scale-105'
                  )}
                  onClick={() => {
                    setPrimaryColor(preset.primary)
                    setSecondaryColor(preset.secondary)
                    setShowCustom(false)
                  }}
                >
                  <span
                    className="absolute inset-0.5 rounded-full"
                    style={{ backgroundColor: `#${preset.primary}` }}
                  />
                  {isActive && (
                    <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                  )}
                </button>
              )
            })}
            <button
              type="button"
              title="Custom color"
              className={cn(
                'relative h-6 w-6 rounded-full border-2 transition-all bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]',
                showCustom
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:border-muted-foreground/50 hover:scale-105'
              )}
              onClick={() => setShowCustom(!showCustom)}
            >
              <Pipette className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
            </button>
          </div>
          {showCustom && (
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={`#${primaryColor}`}
                  onChange={(e) => setPrimaryColor(e.target.value.slice(1))}
                  className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
                />
                <span className="text-xs text-muted-foreground">Primary</span>
              </label>
              <label className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={`#${secondaryColor}`}
                  onChange={(e) => setSecondaryColor(e.target.value.slice(1))}
                  className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
                />
                <span className="text-xs text-muted-foreground">Accent</span>
              </label>
            </div>
          )}
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
