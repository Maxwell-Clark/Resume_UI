import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { Loader2, Sparkles, CheckCircle, AlertCircle, Lightbulb, Wand2 } from 'lucide-react'
import { resumeService } from '@/services/resume'
import { useNotifications } from '@/contexts/NotificationContext'

export interface ApplyRecommendationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendations: string[]
  currentSummary: string
  onApplySummary: (newSummary: string) => void
  onRetailor?: () => void
}

type ApplyStatus = 'idle' | 'applying' | 'success' | 'error'

interface RecommendationState {
  selected: boolean
  status: ApplyStatus
  error?: string
}

export function ApplyRecommendationsDialog({
  open,
  onOpenChange,
  recommendations,
  currentSummary,
  onApplySummary,
  onRetailor,
}: ApplyRecommendationsDialogProps) {
  const { addNotification } = useNotifications()
  const [recStates, setRecStates] = useState<RecommendationState[]>(
    recommendations.map(() => ({ selected: false, status: 'idle' }))
  )
  const [isApplying, setIsApplying] = useState(false)
  const [_appliedCount, setAppliedCount] = useState(0)
  void _appliedCount // suppress unused warning

  const selectedCount = recStates.filter(r => r.selected).length
  const hasSummary = currentSummary && currentSummary.trim().length > 0

  const toggleRecommendation = (index: number) => {
    if (isApplying || !hasSummary) return
    setRecStates(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selected: !updated[index].selected }
      return updated
    })
  }

  const toggleAll = () => {
    if (isApplying || !hasSummary) return
    const allSelected = recStates.every(r => r.selected)
    setRecStates(prev => prev.map(r => ({ ...r, selected: !allSelected })))
  }

  const handleApply = async () => {
    const selectedIndices = recStates
      .map((r, i) => (r.selected ? i : -1))
      .filter(i => i !== -1)

    if (selectedIndices.length === 0) return

    setIsApplying(true)
    setAppliedCount(0)

    // Build a combined instruction from all selected recommendations
    const combinedInstruction = selectedIndices
      .map(i => recommendations[i])
      .join('\n- ')

    const fullInstruction = `Apply the following improvements to this professional summary. Make targeted edits while preserving the core content and structure:\n- ${combinedInstruction}`

    // Mark all selected as applying
    setRecStates(prev => prev.map((r, i) =>
      selectedIndices.includes(i) ? { ...r, status: 'applying' } : r
    ))

    try {
      // Apply all recommendations at once to the summary
      const editedSummary = await resumeService.editText(currentSummary, fullInstruction)

      // Mark all as success
      setRecStates(prev => prev.map((r, i) =>
        selectedIndices.includes(i) ? { ...r, status: 'success' } : r
      ))
      setAppliedCount(selectedIndices.length)

      // Apply the edited summary
      onApplySummary(editedSummary)

      addNotification({
        title: 'Recommendations Applied',
        message: `Successfully applied ${selectedIndices.length} recommendation${selectedIndices.length > 1 ? 's' : ''} to your professional summary.`,
        type: 'success'
      })

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false)
        // Reset states
        setRecStates(recommendations.map(() => ({ selected: false, status: 'idle' })))
        setAppliedCount(0)
      }, 1500)

    } catch (error) {
      console.error('Failed to apply recommendations:', error)

      // Mark all selected as error
      setRecStates(prev => prev.map((r, i) =>
        selectedIndices.includes(i) ? { ...r, status: 'error', error: 'Failed to apply' } : r
      ))

      addNotification({
        title: 'Failed to Apply',
        message: error instanceof Error ? error.message : 'An error occurred while applying recommendations.',
        type: 'error'
      })
    } finally {
      setIsApplying(false)
    }
  }

  const handleClose = () => {
    if (isApplying) return
    onOpenChange(false)
    // Reset states when closing
    setRecStates(recommendations.map(() => ({ selected: false, status: 'idle' })))
    setAppliedCount(0)
  }

  const getStatusIcon = (status: ApplyStatus) => {
    switch (status) {
      case 'applying':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Apply Recommendations"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {hasSummary ? (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How this works</p>
              <p className="text-blue-700 dark:text-blue-300">
                Select the recommendations you want to apply. AI will update your professional summary
                to incorporate the selected improvements while preserving your existing content.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">No professional summary found</p>
              <p className="text-amber-700 dark:text-amber-300">
                Please add a professional summary in the Basics section first, then you can apply
                these recommendations to improve it. Alternatively, use the Retailor option to
                have AI generate a complete tailored resume.
              </p>
            </div>
          </div>
        )}

        {/* Select All */}
        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
          <button
            onClick={toggleAll}
            disabled={isApplying || !hasSummary}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {recStates.every(r => r.selected) ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {selectedCount} of {recommendations.length} selected
          </span>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                recStates[index].selected
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              } ${isApplying ? 'opacity-75' : ''}`}
            >
              <Checkbox
                id={`rec-${index}`}
                checked={recStates[index].selected}
                onCheckedChange={() => toggleRecommendation(index)}
                disabled={isApplying || !hasSummary}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`rec-${index}`}
                  className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer leading-relaxed"
                >
                  {rec}
                </Label>
              </div>
              <div className="shrink-0">
                {getStatusIcon(recStates[index].status)}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {onRetailor && (
              <Button
                variant="outline"
                onClick={() => {
                  handleClose()
                  onRetailor()
                }}
                disabled={isApplying}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Retailor Resume
              </Button>
            )}
            <Button
              onClick={handleApply}
              disabled={isApplying || selectedCount === 0 || !hasSummary}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply {selectedCount > 0 ? `(${selectedCount})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
