import { useState } from 'react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PricingModal } from '@/components/PricingModal'

export function SubscriptionBadge() {
  const { billingStatus, loading } = useSubscription()
  const [showPricingModal, setShowPricingModal] = useState(false)

  if (loading) {
    return (
      <div className="p-3 border-b bg-background/30">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  const planName = billingStatus?.entitlements?.plan_name || 'free'
  const isPremium = planName === 'premium'
  const isBasic = planName === 'basic'

  const tailorsUsed = billingStatus?.usage?.tailors_used ?? 0
  const tailorsLimit = billingStatus?.entitlements?.tailors_per_month ?? 5
  const matchesUsed = billingStatus?.usage?.matches_used ?? 0
  const matchesLimit = billingStatus?.entitlements?.matches_per_month ?? 10

  // Calculate usage percentages
  const tailorsPercent = tailorsLimit === -1 ? 0 : Math.min((tailorsUsed / tailorsLimit) * 100, 100)
  const matchesPercent = matchesLimit === -1 ? 0 : Math.min((matchesUsed / matchesLimit) * 100, 100)

  const getBadgeStyles = () => {
    if (isPremium) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300 dark:border-amber-700'
    }
    if (isBasic) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300 dark:border-blue-700'
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600'
  }

  const formatUsage = (used: number, limit: number) => {
    if (limit === -1) return `${used}/∞`
    return `${used}/${limit}`
  }

  return (
    <>
      <div className="p-3 border-b bg-background/30">
        {/* Plan Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
            getBadgeStyles()
          )}>
            {isPremium && <Crown className="h-3 w-3" />}
            <span className="capitalize">{planName}</span>
          </div>
          {!isPremium && (
            <button
              onClick={() => setShowPricingModal(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Upgrade
            </button>
          )}
        </div>

        {/* Usage Bars */}
        <div className="space-y-1.5">
          {/* Tailors Usage */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Tailors</span>
              <span>{formatUsage(tailorsUsed, tailorsLimit)}</span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  tailorsPercent >= 90 ? 'bg-red-500' : tailorsPercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                )}
                style={{ width: `${tailorsLimit === -1 ? 100 : tailorsPercent}%` }}
              />
            </div>
          </div>

          {/* Matches Usage */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>Matches</span>
              <span>{formatUsage(matchesUsed, matchesLimit)}</span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  matchesPercent >= 90 ? 'bg-red-500' : matchesPercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                )}
                style={{ width: `${matchesLimit === -1 ? 100 : matchesPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <PricingModal
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
      />
    </>
  )
}
