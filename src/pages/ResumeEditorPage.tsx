import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { resumeService } from '@/services/resume'
import type { Resume } from '@/services/resume'
import { getHistoryItemByResumeId, updateHistoryItem, type HistoryItem } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'
import { useTemplate } from '@/contexts/TemplateContext'
import { getTemplateHints } from '@/data/templateHints'
import { Button } from '@/components/ui/button'
import { GuidedTour } from '@/components/GuidedTour'
import { Loader2, Save, ArrowLeft, Plus, Target, ChevronDown, ChevronRight, X } from 'lucide-react'
import { AIEditDialog } from '@/components/AIEditDialog'
import { NewMatchDialog } from '@/components/NewMatchDialog'
import { Dialog } from '@/components/ui/dialog'
import type { ResumeContent } from '@/types/resume'

import { useResumeContent } from '@/hooks/useResumeContent'
import { useMatchAnalysis } from '@/hooks/useMatchAnalysis'
import { useAIEdit } from '@/hooks/useAIEdit'
import {
  EditorToolbar,
  BasicsSection,
  WorkSection,
  EducationSection,
  SkillsSection,
  ProjectsSection,
  CertificationsSection,
  AwardsSection,
  VolunteerSection,
  PublicationsSection,
  LanguagesSection,
  MatchAnalysisPanel,
} from '@/components/editor'

export function ResumeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const { selectedTemplateId: globalTemplateId, primaryColor, secondaryColor, setSelectedTemplateId } = useTemplate()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Per-resume template (falls back to global selection)
  const [resumeTemplateId, setResumeTemplateId] = useState<string>(globalTemplateId)
  const selectedTemplateId = resumeTemplateId
  const templateHints = getTemplateHints(selectedTemplateId)

  // Sync both local and global state when user changes template
  const handleTemplateChange = useCallback((id: string) => {
    setResumeTemplateId(id)
    setSelectedTemplateId(id)
  }, [setSelectedTemplateId])

  // Refs for debounced auto-regeneration
  const regeneratingRef = useRef(false)
  const regenerateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resume name and history state
  const [resumeName, setResumeName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)
  const [pdfVersion, setPdfVersion] = useState(0)

  // Custom hooks
  const content = useResumeContent()
  const match = useMatchAnalysis({
    historyItem,
    setHistoryItem,
    resume,
    buildResumeContent: content.buildResumeContent,
    resumeName,
    selectedTemplateId,
  })
  const aiEdit = useAIEdit({
    basics: content.basics,
    setBasics: content.setBasics,
    workOps: content.workOps,
    educationOps: content.educationOps,
    projectsOps: content.projectsOps,
    matchResults: historyItem?.match_results,
    setEnhancingHighlight: match.setEnhancingHighlight,
  })

  // Load resume
  const loadLatestResume = useCallback(async () => {
    try {
      setLoading(true)
      const resumes = await resumeService.getResumes(1)
      if (resumes.length > 0) {
        navigate(`/editor/${resumes[0].id}`, { replace: true })
      } else {
        setLoading(false)
        setError('No resumes found. Create one by tailoring a resume first.')
      }
    } catch (err) {
      setError('Failed to load latest resume')
      console.error(err)
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (id) {
      loadResume(id)
    } else {
      loadLatestResume()
    }
  }, [id, loadLatestResume])

  const loadResume = async (resumeId: string) => {
    try {
      setLoading(true)
      const data = await resumeService.getResume(resumeId)
      setResume(data)
      setError(null)

      const history = await getHistoryItemByResumeId(resumeId)
      setHistoryItem(prevHistory => {
        if (!history) return prevHistory
        if (history.match_results) return history
        if (prevHistory?.match_results) return { ...history, match_results: prevHistory.match_results }
        return history
      })

      const nameToUse = history?.file_name || data.name
      setResumeName(nameToUse)

      // Hydrate per-resume template selection
      const meta = (data.content as Record<string, unknown>)?.meta as Record<string, unknown> | undefined
      const storedTemplate = meta?.template as string | undefined
      if (storedTemplate) {
        setResumeTemplateId(storedTemplate)
        setSelectedTemplateId(storedTemplate)
      } else {
        setResumeTemplateId(globalTemplateId)
      }

      content.hydrateFromResume(data)
    } catch (err) {
      setError('Failed to load resume')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-regenerate PDF when template or colors change (debounced)
  const regeneratePdf = useCallback(async (
    templateId: string,
    primary: string,
    secondary: string
  ) => {
    if (!id || !resume || regeneratingRef.current || saving) return

    regeneratingRef.current = true
    try {
      const currentContent = content.buildResumeContent() as ResumeContent & Record<string, unknown>
      currentContent.meta = { ...(currentContent.meta as Record<string, unknown> ?? {}), template: templateId }

      const convertResult = await resumeService.convertResumeToPdf(
        currentContent,
        resumeName,
        templateId,
        primary,
        secondary
      )

      const currentHistoryItem = historyItem || await getHistoryItemByResumeId(id)
      if (currentHistoryItem) {
        const newDownloadUrl = convertResult.storage.public_url || convertResult.storage.url
        const updatedHistoryItem = await updateHistoryItem(currentHistoryItem.id, {
          download_url: newDownloadUrl,
        })
        setHistoryItem(updatedHistoryItem)
        setPdfVersion(v => v + 1)
      }
    } catch (err) {
      console.error('Auto-regenerate PDF failed:', err)
    } finally {
      regeneratingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, resume, saving, resumeName, historyItem])

  useEffect(() => {
    if (loading || !resume || !id) return

    if (regenerateTimerRef.current) {
      clearTimeout(regenerateTimerRef.current)
    }

    regenerateTimerRef.current = setTimeout(() => {
      regeneratePdf(selectedTemplateId, primaryColor, secondaryColor)
    }, 800)

    return () => {
      if (regenerateTimerRef.current) {
        clearTimeout(regenerateTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, primaryColor, secondaryColor])

  const handleSave = async () => {
    if (!id || !resume) return

    // Cancel any pending auto-regeneration
    if (regenerateTimerRef.current) {
      clearTimeout(regenerateTimerRef.current)
      regenerateTimerRef.current = null
    }

    try {
      setSaving(true)

      // Build content from form state, embedding the template choice
      const updatedContent = content.buildResumeContent() as ResumeContent & Record<string, unknown>
      updatedContent.meta = { ...(updatedContent.meta as Record<string, unknown> ?? {}), template: selectedTemplateId }

      await resumeService.updateResume(id, {
        name: resumeName,
        content: updatedContent
      })

      // Regenerate PDF and update history
      try {
        const currentHistoryItem = historyItem || await getHistoryItemByResumeId(id)
        const convertResult = await resumeService.convertResumeToPdf(
          updatedContent,
          resumeName,
          selectedTemplateId,
          primaryColor,
          secondaryColor
        )

        if (currentHistoryItem) {
          const newDownloadUrl = convertResult.storage.public_url || convertResult.storage.url
          const updatedHistoryItem = await updateHistoryItem(currentHistoryItem.id, {
            download_url: newDownloadUrl,
            file_name: resumeName
          })
          setHistoryItem(updatedHistoryItem)
          setPdfVersion(v => v + 1)

          addNotification({
            title: 'Resume Updated',
            message: 'Your resume has been saved and regenerated. The new PDF is available in your history.',
            type: 'success'
          })
        } else {
          addNotification({
            title: 'Resume Saved',
            message: 'Your resume has been saved successfully.',
            type: 'success'
          })
        }
      } catch (convertErr) {
        console.error('Failed to regenerate PDF:', convertErr)
        addNotification({
          title: 'Resume Saved',
          message: 'Your resume has been saved, but PDF regeneration failed. You can try again later.',
          type: 'warning'
        })
      }

      await loadResume(id)
    } catch (err) {
      setError('Failed to save resume')
      console.error(err)
      addNotification({
        title: 'Save Failed',
        message: 'Failed to save resume. Please try again.',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !resume) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 mb-4">
          {error || 'Resume not found'}
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/history')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
          <Button onClick={() => navigate('/studio')}>
            <Plus className="mr-2 h-4 w-4" /> Create New Resume
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 break-words">Edit {resumeName || resume.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Last updated: {new Date(resume.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Top Toolbar */}
      <EditorToolbar
        resumeName={resumeName}
        displayName={resumeName || resume.name}
        isEditingName={isEditingName}
        editingNameValue={editingNameValue}
        setEditingNameValue={setEditingNameValue}
        onStartEditName={() => {
          setEditingNameValue(resumeName || resume.name)
          setIsEditingName(true)
        }}
        onFinishEditName={() => {
          setResumeName(editingNameValue)
          setIsEditingName(false)
        }}
        onCancelEditName={() => {
          setEditingNameValue(resumeName)
          setIsEditingName(false)
        }}
        downloadUrl={historyItem?.download_url}
        onPreview={() => aiEdit.setPreviewOpen(true)}
        onDownload={() => {
          if (!historyItem?.download_url) return
          const url = `${historyItem.download_url}${historyItem.download_url.includes('?') ? '&' : '?'}v=${pdfVersion}`
          window.open(url, '_blank')
        }}
        onSave={handleSave}
        saving={saving}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={handleTemplateChange}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => match.setMatchPanelOpen(!match.matchPanelOpen)}
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          aria-label={match.matchPanelOpen ? "Close match panel" : "Open match panel"}
        >
          <Target className="h-5 w-5" />
          {match.matchPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 -rotate-90" />
          )}
        </button>

        {/* Backdrop */}
        {match.matchPanelOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => match.setMatchPanelOpen(false)}
          />
        )}

        {/* Main Editor Column */}
        <div className="flex-1 min-w-0 space-y-8">
          <BasicsSection
            basics={content.basics}
            setBasics={content.setBasics}
            expanded={content.expandedSections.has('basics')}
            onToggle={() => content.toggleSection('basics')}
            onAIEdit={aiEdit.handleAIEdit}
            templateHint={templateHints.basics}
          />
          <WorkSection
            ops={content.workOps}
            expanded={content.expandedSections.has('work')}
            onToggle={() => content.toggleSection('work')}
            onAIEdit={aiEdit.handleAIEdit}
            onQuickEnhance={aiEdit.handleQuickEnhance}
            enhancingHighlight={match.enhancingHighlight}
            hasMatchResults={!!historyItem?.match_results}
          />
          <EducationSection
            ops={content.educationOps}
            expanded={content.expandedSections.has('education')}
            onToggle={() => content.toggleSection('education')}
            onAIEdit={aiEdit.handleAIEdit}
            templateHint={templateHints.education}
          />
          <SkillsSection
            ops={content.skillsOps}
            expanded={content.expandedSections.has('skills')}
            onToggle={() => content.toggleSection('skills')}
            templateHint={templateHints.skills}
          />
          <ProjectsSection
            ops={content.projectsOps}
            expanded={content.expandedSections.has('projects')}
            onToggle={() => content.toggleSection('projects')}
            onAIEdit={aiEdit.handleAIEdit}
          />
          <CertificationsSection
            ops={content.certificationOps}
            expanded={content.expandedSections.has('certifications')}
            onToggle={() => content.toggleSection('certifications')}
            templateHint={templateHints.certifications}
          />
          <AwardsSection
            ops={content.awardOps}
            expanded={content.expandedSections.has('awards')}
            onToggle={() => content.toggleSection('awards')}
          />
          <VolunteerSection
            ops={content.volunteerOps}
            expanded={content.expandedSections.has('volunteer')}
            onToggle={() => content.toggleSection('volunteer')}
          />
          <PublicationsSection
            ops={content.publicationOps}
            expanded={content.expandedSections.has('publications')}
            onToggle={() => content.toggleSection('publications')}
          />
          <LanguagesSection
            ops={content.languageOps}
            expanded={content.expandedSections.has('languages')}
            onToggle={() => content.toggleSection('languages')}
          />

          {/* Save Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-10 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop: Static sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <MatchAnalysisPanel
              historyItem={historyItem}
              matchSectionsExpanded={match.matchSectionsExpanded}
              toggleMatchSection={match.toggleMatchSection}
              onNewMatch={() => match.setNewMatchDialogOpen(true)}
              onRetailor={match.handleRetailor}
              onRematch={match.handleQuickRematch}
              isRetailoring={match.isRetailoring}
              isRematching={match.isRematching}
              currentJobData={match.currentJobData}
              lastGuaranteedResult={match.lastGuaranteedResult}
              getMatchColor={match.getMatchColor}
              getMatchBgColor={match.getMatchBgColor}
            />
          </div>
        </div>

        {/* Mobile: Slide-out drawer */}
        <div className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          match.matchPanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full overflow-y-auto p-4">
            <button
              onClick={() => match.setMatchPanelOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close match panel"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="pr-8">
              <MatchAnalysisPanel
                historyItem={historyItem}
                matchSectionsExpanded={match.matchSectionsExpanded}
                toggleMatchSection={match.toggleMatchSection}
                onNewMatch={() => match.setNewMatchDialogOpen(true)}
                onRetailor={match.handleRetailor}
                onRematch={match.handleQuickRematch}
                isRetailoring={match.isRetailoring}
                isRematching={match.isRematching}
                currentJobData={match.currentJobData}
                lastGuaranteedResult={match.lastGuaranteedResult}
                getMatchColor={match.getMatchColor}
                getMatchBgColor={match.getMatchBgColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Edit Dialog */}
      {aiEdit.editingField && (
        <AIEditDialog
          open={aiEdit.aiDialogOpen}
          onOpenChange={aiEdit.setAiDialogOpen}
          originalText={aiEdit.editingField.currentText}
          fieldLabel={aiEdit.editingField.fieldLabel}
          onApply={aiEdit.handleAIEditApply}
        />
      )}

      {/* PDF Preview Modal */}
      <Dialog
        open={aiEdit.previewOpen}
        onOpenChange={aiEdit.setPreviewOpen}
        title="Resume Preview"
        className="max-w-5xl w-full h-[90vh]"
      >
        <div className="h-[calc(90vh-100px)] w-full">
          {historyItem?.download_url ? (
            <iframe
              key={pdfVersion}
              src={`${historyItem.download_url}${historyItem.download_url.includes('?') ? '&' : '?'}v=${pdfVersion}`}
              className="w-full h-full border-0 rounded"
              title="Resume PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No PDF available. Save your resume to generate a preview.
            </div>
          )}
        </div>
      </Dialog>

      {/* New Match Dialog */}
      <NewMatchDialog
        open={match.newMatchDialogOpen}
        onOpenChange={match.setNewMatchDialogOpen}
        resumeContent={resume?.content || content.buildResumeContent()}
        historyItemId={historyItem?.id}
        onMatchComplete={match.handleMatchComplete}
        onRetailor={match.handleRetailor}
      />

      {/* Guided Tour */}
      <GuidedTour tourId="editor" />
    </div>
  )
}
