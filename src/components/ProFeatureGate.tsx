import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Button } from '@/components/ui/button'
import { UpgradeModal } from '@/components/UpgradeModal'
import { Crown, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProFeatureGateProps {
  children: ReactNode
  featureName?: string
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

export function ProFeatureGate({
  children,
  featureName = 'This feature',
  fallback,
  showUpgradePrompt = true,
  className,
}: ProFeatureGateProps) {
  const { isPro, loading } = useSubscription()
  const navigate = useNavigate()

  if (loading) {
    return null
  }

  if (isPro) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgradePrompt) {
    return null
  }

  return (
    <div className={cn(
      'relative rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800/50">
          <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
            Pro Feature
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {featureName} is available with a Pro subscription. Upgrade to unlock AI-powered features.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/pricing')}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ProButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  featureName?: string
  featureDescription?: string
}

export function ProButton({
  children,
  onClick,
  disabled,
  className,
  variant = 'default',
  size = 'default',
  featureName = 'This feature',
  featureDescription,
}: ProButtonProps) {
  const { isPro, loading } = useSubscription()
  const [modalOpen, setModalOpen] = useState(false)

  const handleClick = () => {
    if (isPro && onClick) {
      onClick()
    } else if (!isPro) {
      setModalOpen(true)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          !isPro && 'relative',
          className
        )}
      >
        {!isPro && (
          <Lock className="h-3 w-3 mr-1 text-amber-500" />
        )}
        {children}
        {!isPro && (
          <span className="ml-1 text-xs text-amber-500 font-medium">PRO</span>
        )}
      </Button>

      <UpgradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        featureName={featureName}
        featureDescription={featureDescription}
      />
    </>
  )
}

interface ProFeatureOverlayProps {
  children: ReactNode
  featureName?: string
  className?: string
}

export function ProFeatureOverlay({
  children,
  featureName = 'AI Features',
  className,
}: ProFeatureOverlayProps) {
  const { isPro, loading } = useSubscription()
  const [modalOpen, setModalOpen] = useState(false)

  if (loading || isPro) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none opacity-50 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
            Unlock {featureName}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Upgrade to Pro for unlimited access to AI-powered resume tools.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>

      <UpgradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        featureName={featureName}
      />
    </div>
  )
}
