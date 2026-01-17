import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { Loader2, Sparkles, CheckCircle, AlertCircle, Lightbulb, Wand2 } from 'lucide-react'
import { resumeService } from '@/services/resume'
import { useNotifications } from '@/contexts/NotificationContext'

// Type definitions for section data
export type SkillCategory = {
  name: string
  keywords: string[]
}

export type WorkEntry = {
  name: string
  position: string
  location?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights: string[]
}

export interface SectionData {
  summary?: string
  skills?: SkillCategory[]
  experience?: WorkEntry[]
}

export interface ApplyRecommendationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendations: string[]

  // Section data - tabs enabled based on availability
  sectionData: SectionData

  // Callbacks for each section
  onApplySummary?: (newSummary: string) => void
  onApplySkills?: (newSkills: SkillCategory[]) => void
  onApplyExperience?: (newExperience: WorkEntry[]) => void

  onRetailor?: () => void
}

type ApplyStatus = 'idle' | 'applying' | 'success' | 'error'
type SectionType = 'summary' | 'skills' | 'experience'

interface RecommendationState {
  selected: boolean
  status: ApplyStatus
  error?: string
}

function TabButton({
  active,
  disabled,
  label,
  onClick
}: {
  active: boolean
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : disabled
            ? 'border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

function parseSkillsText(text: string): SkillCategory[] {
  const lines = text.split('\n').filter(line => line.trim())
  const skills: SkillCategory[] = []

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim()
      const keywordsStr = line.substring(colonIndex + 1).trim()
      const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k)
      if (name && keywords.length > 0) {
        skills.push({ name, keywords })
      }
    }
  }

  return skills
}

function parseHighlights(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0)
}

export function ApplyRecommendationsDialog({
  open,
  onOpenChange,
  recommendations,
  sectionData,
  onApplySummary,
  onApplySkills,
  onApplyExperience,
  onRetailor,
}: ApplyRecommendationsDialogProps) {
  const { addNotification } = useNotifications()
  const [recStates, setRecStates] = useState<RecommendationState[]>(
    recommendations.map(() => ({ selected: false, status: 'idle' }))
  )
  const [isApplying, setIsApplying] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionType>('summary')
  const [selectedEntries, setSelectedEntries] = useState<number[]>([])

  // Determine which sections are available
  const hasSummary = !!(sectionData.summary && sectionData.summary.trim().length > 0)
  const hasSkills = !!(sectionData.skills && sectionData.skills.length > 0)
  const hasExperience = !!(sectionData.experience && sectionData.experience.length > 0)
  const hasAnySection = hasSummary || hasSkills || hasExperience

  // Auto-select first available section
  useEffect(() => {
    if (!hasSummary && hasSkills) {
      setActiveSection('skills')
    } else if (!hasSummary && !hasSkills && hasExperience) {
      setActiveSection('experience')
    } else if (hasSummary) {
      setActiveSection('summary')
    }
  }, [hasSummary, hasSkills, hasExperience])

  // Initialize selected entries when experience section becomes active
  useEffect(() => {
    if (activeSection === 'experience' && sectionData.experience && selectedEntries.length === 0) {
      // Pre-select first entry by default
      setSelectedEntries([0])
    }
  }, [activeSection, sectionData.experience, selectedEntries.length])

  const selectedCount = recStates.filter(r => r.selected).length

  const toggleRecommendation = (index: number) => {
    if (isApplying || !hasAnySection) return
    setRecStates(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], selected: !updated[index].selected }
      return updated
    })
  }

  const toggleAll = () => {
    if (isApplying || !hasAnySection) return
    const allSelected = recStates.every(r => r.selected)
    setRecStates(prev => prev.map(r => ({ ...r, selected: !allSelected })))
  }

  const toggleEntry = (index: number) => {
    if (isApplying) return
    setSelectedEntries(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleApply = async () => {
    const selectedIndices = recStates
      .map((r, i) => (r.selected ? i : -1))
      .filter(i => i !== -1)

    if (selectedIndices.length === 0) return

    setIsApplying(true)

    // Mark all selected as applying
    setRecStates(prev => prev.map((r, i) =>
      selectedIndices.includes(i) ? { ...r, status: 'applying' } : r
    ))

    try {
      const selectedRecs = selectedIndices.map(i => recommendations[i])

      switch (activeSection) {
        case 'summary':
          await applySummary(selectedRecs)
          break
        case 'skills':
          await applySkills(selectedRecs)
          break
        case 'experience':
          await applyExperience(selectedRecs)
          break
      }

      // Mark all as success
      setRecStates(prev => prev.map((r, i) =>
        selectedIndices.includes(i) ? { ...r, status: 'success' } : r
      ))

      addNotification({
        title: 'Recommendations Applied',
        message: `Successfully applied ${selectedIndices.length} recommendation${selectedIndices.length > 1 ? 's' : ''} to your ${activeSection}.`,
        type: 'success'
      })

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false)
        resetStates()
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

  const applySummary = async (selectedRecs: string[]) => {
    if (!sectionData.summary || !onApplySummary) return

    const instruction = `Apply the following improvements to this professional summary. Make targeted edits while preserving the core content and structure:\n- ${selectedRecs.join('\n- ')}`
    const editedSummary = await resumeService.editText(sectionData.summary, instruction)
    onApplySummary(editedSummary)
  }

  const applySkills = async (selectedRecs: string[]) => {
    if (!sectionData.skills || !onApplySkills) return

    // Serialize skills to text format
    const skillsText = sectionData.skills
      .map(cat => `${cat.name}: ${cat.keywords.join(', ')}`)
      .join('\n')

    const instruction = `Apply the following improvements to these skills. Return in the EXACT same format (Category: skill1, skill2, skill3). Keep category names on their own line followed by colon and comma-separated skills:\n- ${selectedRecs.join('\n- ')}\n\nCurrent skills:\n${skillsText}`

    const editedText = await resumeService.editText(skillsText, instruction)
    const newSkills = parseSkillsText(editedText)

    if (newSkills.length > 0) {
      onApplySkills(newSkills)
    } else {
      throw new Error('Failed to parse updated skills. The AI response format was unexpected.')
    }
  }

  const applyExperience = async (selectedRecs: string[]) => {
    if (!sectionData.experience || !onApplyExperience || selectedEntries.length === 0) return

    const updatedExperience = [...sectionData.experience]

    for (const entryIndex of selectedEntries) {
      const entry = sectionData.experience[entryIndex]
      if (!entry.highlights || entry.highlights.length === 0) continue

      const highlightsText = entry.highlights.map(h => `- ${h}`).join('\n')

      const instruction = `Apply the following improvements to these bullet points for the ${entry.position} role at ${entry.name}. Return ONLY the updated bullet points, one per line, starting with a dash (-):\n- ${selectedRecs.join('\n- ')}\n\nCurrent bullet points:\n${highlightsText}`

      const editedText = await resumeService.editText(highlightsText, instruction)
      const newHighlights = parseHighlights(editedText)

      if (newHighlights.length > 0) {
        updatedExperience[entryIndex] = { ...entry, highlights: newHighlights }
      }
    }

    onApplyExperience(updatedExperience)
  }

  const resetStates = () => {
    setRecStates(recommendations.map(() => ({ selected: false, status: 'idle' })))
    setSelectedEntries([])
  }

  const handleClose = () => {
    if (isApplying) return
    onOpenChange(false)
    resetStates()
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

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'summary':
        return 'AI will update your professional summary to incorporate the selected improvements while preserving your existing content.'
      case 'skills':
        return 'AI will reorganize and enhance your skills based on the selected recommendations while keeping your existing skill categories.'
      case 'experience':
        return 'AI will improve the bullet points for the selected positions based on the recommendations.'
    }
  }

  const canApply = () => {
    if (selectedCount === 0) return false
    switch (activeSection) {
      case 'summary':
        return hasSummary && !!onApplySummary
      case 'skills':
        return hasSkills && !!onApplySkills
      case 'experience':
        return hasExperience && !!onApplyExperience && selectedEntries.length > 0
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
        {/* Section Tabs */}
        <div className="flex border-b dark:border-slate-700">
          <TabButton
            active={activeSection === 'summary'}
            disabled={!hasSummary}
            label="Summary"
            onClick={() => setActiveSection('summary')}
          />
          <TabButton
            active={activeSection === 'skills'}
            disabled={!hasSkills}
            label="Skills"
            onClick={() => setActiveSection('skills')}
          />
          <TabButton
            active={activeSection === 'experience'}
            disabled={!hasExperience}
            label="Experience"
            onClick={() => setActiveSection('experience')}
          />
        </div>

        {/* Info Box */}
        {hasAnySection ? (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How this works</p>
              <p className="text-blue-700 dark:text-blue-300">
                {getSectionDescription()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">No content available</p>
              <p className="text-amber-700 dark:text-amber-300">
                Please add content to your resume sections first (summary, skills, or experience),
                then you can apply these recommendations to improve them.
              </p>
            </div>
          </div>
        )}

        {/* Experience Entry Selection */}
        {activeSection === 'experience' && hasExperience && sectionData.experience && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select positions to update:
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sectionData.experience.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    id={`entry-${index}`}
                    checked={selectedEntries.includes(index)}
                    onCheckedChange={() => toggleEntry(index)}
                    disabled={isApplying || entry.highlights.length === 0}
                  />
                  <Label
                    htmlFor={`entry-${index}`}
                    className={`text-sm cursor-pointer ${
                      entry.highlights.length === 0
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {entry.position} at {entry.name}
                    {entry.highlights.length === 0 && ' (no highlights)'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select All */}
        <div className="flex items-center justify-between border-b dark:border-slate-700 pb-3">
          <button
            onClick={toggleAll}
            disabled={isApplying || !hasAnySection}
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
                disabled={isApplying || !hasAnySection}
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
              disabled={isApplying || !canApply()}
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
