import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Crown, Check, Sparkles, Wand2, Target, Zap, Clock, Loader2 } from 'lucide-react'

interface CheckoutSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutSuccessModal({
  open,
  onOpenChange,
}: CheckoutSuccessModalProps) {
  const navigate = useNavigate()
  const { billingStatus, loading: billingLoading, refreshBillingStatus } = useSubscription()
  const [confettiActive, setConfettiActive] = useState(false)

  const planName = billingStatus?.entitlements?.plan_name || 'pro'
  const isPremium = planName === 'premium'

  // Generate features dynamically from entitlements
  const generateDynamicFeatures = () => {
    const entitlements = billingStatus?.entitlements
    if (!entitlements) return []

    const features: { icon: typeof Wand2; text: string }[] = []

    // Tailors per month
    if (entitlements.tailors_per_month === -1) {
      features.push({ icon: Wand2, text: 'Unlimited AI-powered resume tailoring' })
    } else {
      features.push({ icon: Wand2, text: `${entitlements.tailors_per_month} AI-powered resume tailors per month` })
    }

    // Matches per month
    if (entitlements.matches_per_month === -1) {
      features.push({ icon: Target, text: 'Unlimited job match analyses' })
    } else {
      features.push({ icon: Target, text: `${entitlements.matches_per_month} job match analyses per month` })
    }

    // Custom prompts or AI-powered editing
    if (entitlements.custom_prompts) {
      features.push({ icon: Sparkles, text: 'Custom AI prompts' })
    } else {
      features.push({ icon: Sparkles, text: 'AI-powered editing' })
    }

    // Priority processing (only show if available)
    if (entitlements.priority_processing) {
      features.push({ icon: Zap, text: 'Priority processing' })
    }

    // History retention
    features.push({ icon: Clock, text: `${entitlements.history_retention_days}-day history retention` })

    return features
  }

  const features = generateDynamicFeatures()

  // Trigger confetti effect and refresh billing status when modal opens
  useEffect(() => {
    if (!open) return

    setConfettiActive(true)
    const confettiTimer = setTimeout(() => setConfettiActive(false), 3000)

    // Refresh billing status with retries to ensure webhook has processed
    const timers: NodeJS.Timeout[] = []

    // Initial refresh after short delay
    timers.push(setTimeout(() => refreshBillingStatus(), 500))

    // Retry after 2 seconds in case first refresh was too early
    timers.push(setTimeout(() => refreshBillingStatus(), 2500))

    // Final retry after 5 seconds for slow webhook processing
    timers.push(setTimeout(() => refreshBillingStatus(), 5500))

    return () => {
      clearTimeout(confettiTimer)
      timers.forEach(t => clearTimeout(t))
    }
  }, [open, refreshBillingStatus])

  const handleStartUsing = () => {
    onOpenChange(false)
    navigate('/studio')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={true}
      className="max-w-md overflow-hidden"
    >
      {/* Confetti Animation */}
      {confettiActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rotate-45"
                style={{
                  backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="text-center relative">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-orange-200 dark:from-amber-700/50 dark:via-amber-600/50 dark:to-orange-600/50 flex items-center justify-center mb-4 animate-bounce-once">
          <Crown className="h-10 w-10 text-amber-600 dark:text-amber-300" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome to {isPremium ? 'Pro' : 'Basic'}!
        </h2>

        {/* Subtitle */}
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your subscription is now active. You've unlocked powerful AI features to supercharge your job search.
        </p>

        {/* Features Unlocked */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Features Now Unlocked
            {billingLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            )}
          </h3>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6"
          onClick={handleStartUsing}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isPremium ? 'Get Started with Pro' : 'Get Started'}
        </Button>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-in-out;
        }
      `}</style>
    </Dialog>
  )
}
