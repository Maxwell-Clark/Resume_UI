import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles, Check, Zap } from 'lucide-react'
import { PricingModal } from '@/components/PricingModal'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  featureDescription?: string
  requiredPlan?: 'basic' | 'premium'
}

export function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  featureDescription,
  requiredPlan = 'basic',
}: UpgradeModalProps) {
  const [showPricingModal, setShowPricingModal] = useState(false)

  const handleViewPlans = () => {
    onOpenChange(false)
    setShowPricingModal(true)
  }

  const isBasicSufficient = requiredPlan === 'basic'

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        showCloseButton={true}
        className="max-w-lg"
      >
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800/50 dark:to-amber-700/50 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Unlock {featureName}
          </h2>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {featureDescription || `${featureName} is a Pro feature. Upgrade your plan to unlock AI-powered resume tools and stand out from the competition.`}
          </p>

          {/* Plan Options */}
          <div className="grid gap-3 mb-6">
            {isBasicSufficient && (
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">Basic</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">$12<span className="text-sm font-normal text-slate-500">/mo</span></span>
                </div>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-500" />
                    25 tailors per month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-500" />
                    50 match analyses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-500" />
                    AI-powered editing
                  </li>
                </ul>
              </div>
            )}

            <div className="p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                POPULAR
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-slate-900 dark:text-slate-100">Premium</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">$25<span className="text-sm font-normal text-slate-500">/mo</span></span>
              </div>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                  Unlimited tailors
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                  Unlimited match analyses
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                  Custom AI prompts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                  Priority processing
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={handleViewPlans}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </div>
        </div>
      </Dialog>

      <PricingModal
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
      />
    </>
  )
}
