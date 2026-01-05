import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { resumeService } from '@/services/resume'
import { useNotifications } from '@/contexts/NotificationContext'

export type AIEditOption = 
  | 'clarify'
  | 'professional'
  | 'concise'
  | 'expand'
  | 'action_verbs'
  | 'quantify'
  | 'custom'

const CANNED_OPTIONS: Array<{ value: AIEditOption; label: string; instruction: string }> = [
  {
    value: 'clarify',
    label: 'Clarify / Make clearer',
    instruction: 'Rewrite this text to be clearer and easier to understand while maintaining the same meaning.'
  },
  {
    value: 'professional',
    label: 'Edit for professionalism',
    instruction: 'Rewrite this text to be more professional and polished, suitable for a resume.'
  },
  {
    value: 'concise',
    label: 'Make more concise',
    instruction: 'Make this text more concise and impactful while keeping all important information.'
  },
  {
    value: 'expand',
    label: 'Expand / Add more detail',
    instruction: 'Expand this text with more relevant details and context.'
  },
  {
    value: 'action_verbs',
    label: 'Use stronger action verbs',
    instruction: 'Rewrite this text using stronger, more impactful action verbs.'
  },
  {
    value: 'quantify',
    label: 'Add quantifiable metrics',
    instruction: 'Add quantifiable metrics, numbers, or specific achievements to this text where appropriate.'
  }
]

export interface AIEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  fieldLabel: string
  onApply: (editedText: string) => void
}

export function AIEditDialog({
  open,
  onOpenChange,
  originalText,
  fieldLabel,
  onApply
}: AIEditDialogProps) {
  const { addNotification } = useNotifications()
  const [selectedOption, setSelectedOption] = useState<AIEditOption>('clarify')
  const [customInstruction, setCustomInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedOption('clarify')
      setCustomInstruction('')
      setLoading(false)
    }
  }, [open])

  const handleApply = async () => {
    if (!originalText.trim()) {
      addNotification({
        title: 'Error',
        message: 'Original text cannot be empty',
        type: 'error'
      })
      return
    }

    let instruction: string
    if (selectedOption === 'custom') {
      if (!customInstruction.trim()) {
        addNotification({
          title: 'Error',
          message: 'Please enter a custom instruction',
          type: 'error'
        })
        return
      }
      instruction = customInstruction.trim()
    } else {
      const option = CANNED_OPTIONS.find(opt => opt.value === selectedOption)
      instruction = option?.instruction || ''
    }

    try {
      setLoading(true)
      const editedText = await resumeService.editText(originalText, instruction)
      onApply(editedText)
      onOpenChange(false)
      addNotification({
        title: 'Success',
        message: 'Text edited successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to edit text:', error)
      addNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to edit text. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`AI Edit: ${fieldLabel}`}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Original Text Display */}
        <div className="space-y-2">
          <Label>Original Text</Label>
          <Textarea
            value={originalText}
            readOnly
            rows={4}
            className="bg-slate-50 dark:bg-slate-900"
          />
        </div>

        {/* Canned Options */}
        <div className="space-y-2">
          <Label>Edit Option</Label>
          <div className="grid grid-cols-2 gap-2">
            {CANNED_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedOption === option.value ? 'default' : 'outline'}
                onClick={() => setSelectedOption(option.value)}
                className="justify-start text-left h-auto py-2 px-3"
                disabled={loading}
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant={selectedOption === 'custom' ? 'default' : 'outline'}
              onClick={() => setSelectedOption('custom')}
              className="justify-start text-left h-auto py-2 px-3"
              disabled={loading}
            >
              Custom Instruction
            </Button>
          </div>
        </div>

        {/* Custom Instruction Input */}
        {selectedOption === 'custom' && (
          <div className="space-y-2">
            <Label>Custom Instruction</Label>
            <Textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Describe how you want to edit this text..."
              rows={3}
              disabled={loading}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || !originalText.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Apply
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}



