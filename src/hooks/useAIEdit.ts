import { useState, useCallback } from 'react'
import { resumeService } from '@/services/resume'
import { useNotifications } from '@/contexts/NotificationContext'
import type { WorkEntry, EducationEntry, ProjectEntry } from '@/types/resume'
import type { ArrayFieldOps } from './useArrayField'
import type { MatchResults } from '@/lib/history'

export type EditingFieldType = 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight'

interface EditingField {
  type: EditingFieldType
  workIndex?: number
  highlightIndex?: number
  educationIndex?: number
  detailIndex?: number
  projectIndex?: number
  fieldLabel: string
  currentText: string
}

export interface UseAIEditReturn {
  aiDialogOpen: boolean
  setAiDialogOpen: (open: boolean) => void
  editingField: EditingField | null
  previewOpen: boolean
  setPreviewOpen: (open: boolean) => void
  handleAIEdit: (
    type: EditingFieldType,
    fieldLabel: string,
    currentText: string,
    workIndex?: number,
    highlightIndex?: number,
    educationIndex?: number,
    detailIndex?: number,
    projectIndex?: number
  ) => void
  handleAIEditApply: (editedText: string) => void
  handleQuickEnhance: (workIndex: number, highlightIndex: number) => Promise<void>
}

interface UseAIEditOptions {
  basics: { name: string; label: string; email: string; phone: string; summary: string; location: string; website: string }
  setBasics: (basics: UseAIEditOptions['basics']) => void
  workOps: ArrayFieldOps<WorkEntry>
  educationOps: ArrayFieldOps<EducationEntry>
  projectsOps: ArrayFieldOps<ProjectEntry>
  matchResults: MatchResults | null | undefined
  setEnhancingHighlight: (v: { workIndex: number; highlightIndex: number } | null) => void
}

export function useAIEdit({
  basics,
  setBasics,
  workOps,
  educationOps,
  projectsOps,
  matchResults,
  setEnhancingHighlight,
}: UseAIEditOptions): UseAIEditReturn {
  const { addNotification } = useNotifications()
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<EditingField | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleAIEdit = useCallback((
    type: EditingFieldType,
    fieldLabel: string,
    currentText: string,
    workIndex?: number,
    highlightIndex?: number,
    educationIndex?: number,
    detailIndex?: number,
    projectIndex?: number
  ) => {
    setEditingField({ type, workIndex, highlightIndex, educationIndex, detailIndex, projectIndex, fieldLabel, currentText: currentText || '' })
    setAiDialogOpen(true)
  }, [])

  const handleAIEditApply = useCallback((editedText: string) => {
    if (!editingField) return

    switch (editingField.type) {
      case 'basics_summary':
        setBasics({ ...basics, summary: editedText })
        break
      case 'work_summary':
        if (editingField.workIndex !== undefined) {
          const updated = [...workOps.items]
          updated[editingField.workIndex] = { ...updated[editingField.workIndex], summary: editedText }
          workOps.setItems(updated)
        }
        break
      case 'work_highlight':
        if (editingField.workIndex !== undefined && editingField.highlightIndex !== undefined) {
          const updated = [...workOps.items]
          updated[editingField.workIndex].highlights[editingField.highlightIndex] = editedText
          workOps.setItems(updated)
        }
        break
      case 'education_detail':
        if (editingField.educationIndex !== undefined && editingField.detailIndex !== undefined) {
          const updated = [...educationOps.items]
          updated[editingField.educationIndex].details[editingField.detailIndex] = editedText
          educationOps.setItems(updated)
        }
        break
      case 'project_description':
        if (editingField.projectIndex !== undefined) {
          const updated = [...projectsOps.items]
          updated[editingField.projectIndex] = { ...updated[editingField.projectIndex], description: editedText }
          projectsOps.setItems(updated)
        }
        break
      case 'project_highlight':
        if (editingField.projectIndex !== undefined && editingField.highlightIndex !== undefined) {
          const updated = [...projectsOps.items]
          updated[editingField.projectIndex].highlights[editingField.highlightIndex] = editedText
          projectsOps.setItems(updated)
        }
        break
    }

    setEditingField(null)
  }, [editingField, basics, setBasics, workOps, educationOps, projectsOps])

  const handleQuickEnhance = useCallback(async (workIndex: number, highlightIndex: number) => {
    if (!matchResults) return

    setEnhancingHighlight({ workIndex, highlightIndex })
    try {
      const bullet = workOps.items[workIndex].highlights[highlightIndex]

      const gaps = matchResults.gaps_detailed
        ?.filter(g => g.category === 'experience')
        ?.slice(0, 3) || []
      const recommendations = matchResults.recommendations?.slice(0, 3) || []

      const prompt = `Enhance this resume bullet point to better match the job description.

Current bullet: "${bullet}"

Instructions:
- Address these gaps if applicable: ${gaps.map(g => g.description).join('; ') || 'none'}
- Apply these recommendations: ${recommendations.join('; ') || 'none'}
- Keep it concise (1-2 lines)
- Use strong action verbs
- Maintain truthfulness - only reword, don't invent new achievements`

      const enhanced = await resumeService.editText(bullet, prompt)

      const updated = [...workOps.items]
      updated[workIndex].highlights[highlightIndex] = enhanced
      workOps.setItems(updated)

      addNotification({ title: 'Enhanced', message: 'Bullet point improved for job match', type: 'success' })
    } catch (error) {
      console.error('JD enhance failed:', error)
      addNotification({ title: 'Error', message: 'Failed to enhance bullet', type: 'error' })
    } finally {
      setEnhancingHighlight(null)
    }
  }, [matchResults, workOps, setEnhancingHighlight, addNotification])

  return {
    aiDialogOpen, setAiDialogOpen,
    editingField,
    previewOpen, setPreviewOpen,
    handleAIEdit, handleAIEditApply, handleQuickEnhance,
  }
}
