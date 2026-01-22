import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { resumeService, generateRetailorPrompt, type ParsedResume, type JobData, type MatchResponse } from '@/services/resume'
import type { Resume } from '@/services/resume'
import { getHistoryItemByResumeId, getHistoryItemById, updateHistoryItem, type HistoryItem, type MatchResults } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'
import { ProButton } from '@/components/ProFeatureGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tooltip } from '@/components/ui/tooltip'
import { GuidedTour } from '@/components/GuidedTour'
import { Loader2, Save, ArrowLeft, Plus, Trash2, X, User, Briefcase, GraduationCap, Code, FolderKanban, Award, Sparkles, Edit, Download, Eye, Trophy, Heart, BookOpen, Languages, ChevronDown, ChevronRight, Target, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, Wand2, RefreshCw, HelpCircle } from 'lucide-react'
import { AIEditDialog } from '@/components/AIEditDialog'
import { ApplyRecommendationsDialog } from '@/components/ApplyRecommendationsDialog'
import { NewMatchDialog } from '@/components/NewMatchDialog'
import { Dialog } from '@/components/ui/dialog'
import type {
  WorkEntry,
  EducationEntry,
  SkillCategory,
  ProjectEntry,
  CertificationEntry,
  AwardEntry,
  VolunteerEntry,
  PublicationEntry,
  LanguageEntry,
  ResumeContent,
} from '@/types/resume'

export function ResumeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for all sections
  const [basics, setBasics] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    location: '',
    website: ''
  })
  const [work, setWork] = useState<WorkEntry[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([])
  const [skills, setSkills] = useState<SkillCategory[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [certifications, setCertifications] = useState<CertificationEntry[]>([])
  const [awards, setAwards] = useState<AwardEntry[]>([])
  const [volunteer, setVolunteer] = useState<VolunteerEntry[]>([])
  const [publications, setPublications] = useState<PublicationEntry[]>([])
  const [languages, setLanguages] = useState<LanguageEntry[]>([])

  // Resume name and history state
  const [resumeName, setResumeName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)

  // AI Edit Dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<{
    type: 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight'
    workIndex?: number
    highlightIndex?: number
    educationIndex?: number
    detailIndex?: number
    projectIndex?: number
    fieldLabel: string
    currentText: string
  } | null>(null)

  // PDF Preview state
  const [previewOpen, setPreviewOpen] = useState(false)

  // Apply Recommendations dialog state
  const [recommendationsDialogOpen, setRecommendationsDialogOpen] = useState(false)

  // New Match dialog state
  const [newMatchDialogOpen, setNewMatchDialogOpen] = useState(false)
  const [currentJobData, setCurrentJobData] = useState<JobData | null>(null)
  const [currentMatchResult, setCurrentMatchResult] = useState<MatchResponse | null>(null)

  // Retailor state
  const [isRetailoring, setIsRetailoring] = useState(false)

  // Quick rematch state
  const [isRematching, setIsRematching] = useState(false)

  // Match panel drawer state - auto-open on large screens
  const [matchPanelOpen, setMatchPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return false
  })

  // Match analysis collapsible sections state
  const [matchSectionsExpanded, setMatchSectionsExpanded] = useState<{
    strengths: boolean
    gaps: boolean
    recommendations: boolean
  }>({ strengths: true, gaps: true, recommendations: true })

  const toggleMatchSection = (section: 'strengths' | 'gaps' | 'recommendations') => {
    setMatchSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Accordion state - basics, work, education, skills start expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basics', 'work', 'education', 'skills'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const expandSection = (section: string) => {
    setExpandedSections(prev => {
      if (prev.has(section)) return prev
      const newSet = new Set(prev)
      newSet.add(section)
      return newSet
    })
  }

  // Build current resume content from state (matching the format used in handleSave)
  const buildResumeContent = useCallback((): ParsedResume => {
    const content: ResumeContent = {}

    // Build basics - matching handleSave structure
    content.basics = {}
    content.basics.name = basics.name?.trim() || 'Resume'
    if (basics.email?.trim()) content.basics.email = basics.email.trim()
    if (basics.phone?.trim()) content.basics.phone = basics.phone.trim()
    if (basics.location?.trim()) content.basics.location = basics.location.trim()
    if (basics.website?.trim()) content.basics.website = basics.website.trim()
    if (basics.summary?.trim()) content.basics.summary = basics.summary.trim()

    // Build work - filter out empty entries
    const validWork = work
      .filter(w => w.name && w.position)
      .map(w => ({
        name: w.name,
        position: w.position,
        ...(w.location && { location: w.location }),
        ...(w.startDate && { startDate: w.startDate }),
        ...(w.endDate && { endDate: w.endDate }),
        ...(w.summary && { summary: w.summary }),
        highlights: w.highlights.filter(h => h.trim())
      }))
    if (validWork.length > 0) content.work = validWork

    // Build education
    const validEducation = education
      .filter(e => e.institution)
      .map(e => ({
        institution: e.institution,
        ...(e.studyType && { studyType: e.studyType }),
        ...(e.area && { area: e.area }),
        ...(e.startDate && { startDate: e.startDate }),
        ...(e.endDate && { endDate: e.endDate }),
        ...(e.gpa && { gpa: e.gpa }),
        details: e.details.filter(d => d.trim())
      }))
    if (validEducation.length > 0) content.education = validEducation

    // Build skills
    const validSkills = skills
      .filter(s => s.name && s.keywords.length > 0)
      .map(s => ({
        name: s.name,
        keywords: s.keywords.filter(k => k.trim())
      }))
    if (validSkills.length > 0) content.skills = validSkills

    // Build projects
    const validProjects = projects
      .filter(p => p.name)
      .map(p => ({
        name: p.name,
        ...(p.description && { description: p.description }),
        ...(p.url && { url: p.url }),
        ...(p.startDate && { startDate: p.startDate }),
        ...(p.endDate && { endDate: p.endDate }),
        highlights: p.highlights.filter(h => h.trim())
      }))
    if (validProjects.length > 0) content.projects = validProjects

    // Build certifications
    const validCerts = certifications.filter(c => c.name)
    if (validCerts.length > 0) content.certificates = validCerts

    // Build awards
    const validAwards = awards.filter(a => a.title)
    if (validAwards.length > 0) content.awards = validAwards

    // Build volunteer
    const validVolunteer = volunteer
      .filter(v => v.organization)
      .map(v => ({
        organization: v.organization,
        ...(v.position && { position: v.position }),
        ...(v.startDate && { startDate: v.startDate }),
        ...(v.endDate && { endDate: v.endDate }),
        ...(v.summary && { summary: v.summary }),
        highlights: v.highlights.filter(h => h.trim())
      }))
    if (validVolunteer.length > 0) content.volunteer = validVolunteer

    // Build publications
    const validPublications = publications.filter(p => p.name)
    if (validPublications.length > 0) content.publications = validPublications

    // Build languages
    const validLanguages = languages.filter(l => l.language)
    if (validLanguages.length > 0) content.languages = validLanguages

    // Also add person and experience aliases for API compatibility
    content.person = content.basics
    content.experience = content.work || []

    return content as ParsedResume
  }, [basics, work, education, skills, projects, certifications, awards, volunteer, publications, languages])

  // Handle match completion
  const handleMatchComplete = useCallback((results: MatchResults, jobData: JobData) => {
    // Update history item with new match results
    if (historyItem) {
      setHistoryItem({ ...historyItem, match_results: results })
    }
    setCurrentJobData(jobData)
    setCurrentMatchResult({
      match_percentage: results.match_percentage,
      strengths: results.strengths,
      gaps: results.gaps,
      recommendations: results.recommendations,
    })
    addNotification({
      title: 'Match Analysis Complete',
      message: `Your resume achieved a ${results.match_percentage}% match score.`,
      type: 'success'
    })
  }, [historyItem, addNotification])

  // Handle retailor
  const handleRetailor = useCallback(async (jobData?: JobData, matchResult?: MatchResponse) => {
    // Try: passed param > currentJobData > historyItem.job_json
    const job = jobData || currentJobData || (historyItem?.job_json as JobData | undefined)
    const match = matchResult || currentMatchResult || (historyItem?.match_results ? {
      match_percentage: historyItem.match_results.match_percentage,
      strengths: historyItem.match_results.strengths,
      gaps: historyItem.match_results.gaps,
      recommendations: historyItem.match_results.recommendations,
    } : null)

    if (!job || !match) {
      addNotification({
        title: 'Cannot Retailor',
        message: 'Please run a match analysis first to get job data.',
        type: 'error'
      })
      return
    }

    setIsRetailoring(true)

    try {
      const resumeContent = resume?.content || buildResumeContent()
      const prompt = generateRetailorPrompt(match)
      const fileName = `${resumeName || 'Resume'}_Tailored_${Date.now()}`

      const result = await resumeService.tailorResume(
        resumeContent as ParsedResume,
        job,
        fileName,
        historyItem?.id,
        prompt
      )

      // Get the download URL
      const downloadUrl = result.storage.public_url || result.storage.url || result.storage.signed_url || ''

      // Update history item
      if (historyItem) {
        await updateHistoryItem(historyItem.id, { download_url: downloadUrl, status: 'tailored' })
        // Re-fetch to get the updated data from backend
        const refreshedHistory = await getHistoryItemById(historyItem.id)
        if (refreshedHistory) {
          setHistoryItem(refreshedHistory)
        }
      }

      addNotification({
        title: 'Resume Tailored',
        message: 'Your resume has been retailored. Check the History page to download.',
        type: 'success'
      })
    } catch (err) {
      console.error('Retailor failed:', err)
      addNotification({
        title: 'Retailor Failed',
        message: err instanceof Error ? err.message : 'An error occurred while tailoring.',
        type: 'error'
      })
    } finally {
      setIsRetailoring(false)
    }
  }, [currentJobData, currentMatchResult, historyItem, resume, buildResumeContent, resumeName, addNotification])

  // Handle quick rematch using saved job_json
  const handleQuickRematch = useCallback(async () => {
    const job = historyItem?.job_json as JobData | undefined

    if (!job) {
      addNotification({
        title: 'Cannot Rematch',
        message: 'No saved job data found. Use "New Match" to enter a job description.',
        type: 'error'
      })
      return
    }

    setIsRematching(true)

    try {
      const resumeContent = resume?.content || buildResumeContent()

      // Run match analysis
      const result = await resumeService.matchResume(resumeContent as ParsedResume, job)

      // Build match results
      const matchResults: MatchResults = {
        match_percentage: result.match_percentage,
        strengths: result.strengths,
        gaps: result.gaps,
        recommendations: result.recommendations,
        matched_at: new Date().toISOString(),
      }

      // Save match results to history
      if (historyItem) {
        await updateHistoryItem(historyItem.id, { match_results: matchResults })
        setHistoryItem({ ...historyItem, match_results: matchResults })
      }

      // Update local state
      setCurrentJobData(job)
      setCurrentMatchResult(result)

      addNotification({
        title: 'Match Analysis Complete',
        message: `Your resume achieved a ${result.match_percentage}% match score.`,
        type: 'success'
      })
    } catch (err) {
      console.error('Rematch failed:', err)
      addNotification({
        title: 'Rematch Failed',
        message: err instanceof Error ? err.message : 'An error occurred during match analysis.',
        type: 'error'
      })
    } finally {
      setIsRematching(false)
    }
  }, [historyItem, resume, buildResumeContent, addNotification])

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
      
      // Load history item and set default name
      // Preserve existing match_results if the fresh fetch doesn't have it
      const history = await getHistoryItemByResumeId(resumeId)
      setHistoryItem(prevHistory => {
        if (!history) return prevHistory
        // If fetched history has match_results, use it; otherwise preserve existing
        if (history.match_results) {
          return history
        }
        // Preserve existing match_results if we have them
        if (prevHistory?.match_results) {
          return { ...history, match_results: prevHistory.match_results }
        }
        return history
      })
      
      // Set resume name with default logic
      // Prefer history file_name if it exists, otherwise use resume name
      const nameToUse = history?.file_name || data.name
      
      setResumeName(nameToUse)
      
      if (data.content) {
        const content = data.content as ResumeContent

        // Load basics
        if (content.basics) {
          const basics = content.basics as Record<string, unknown>
          setBasics({
            name: (basics.name as string) || '',
            email: (basics.email as string) || '',
            phone: (basics.phone as string) || '',
            summary: (basics.summary as string) || '',
            location: typeof basics.location === 'string'
              ? basics.location
              : ((basics.location as Record<string, unknown>)?.address as string) || '',
            website: (basics.website as string) || ''
          })
        } else if (content.person) {
          const person = content.person as Record<string, unknown>
          setBasics({
            name: (person.name as string) || '',
            email: (person.email as string) || '',
            phone: (person.phone as string) || '',
            summary: ((content as Record<string, unknown>).summary as string) || '',
            location: (person.location as string) || '',
            website: ((person.links as string[])?.[0]) || ''
          })
        }

        // Load work/experience
        if (content.work && Array.isArray(content.work)) {
          setWork(content.work.map((w) => ({
            name: w.name || '',
            position: w.position || '',
            location: w.location || '',
            startDate: w.startDate || '',
            endDate: w.endDate || '',
            summary: w.summary || '',
            highlights: Array.isArray(w.highlights) ? w.highlights : []
          })))
        } else if (content.experience && Array.isArray(content.experience)) {
          const expData = content.experience as unknown as Array<Record<string, unknown>>
          setWork(expData.map((exp) => ({
            name: (exp.company as string) || '',
            position: (exp.title as string) || '',
            location: (exp.location as string) || '',
            startDate: (exp.start_date as string) || '',
            endDate: (exp.end_date as string) || '',
            summary: '',
            highlights: Array.isArray(exp.bullets) ? exp.bullets as string[] : []
          })))
        }

        // Load education
        if (content.education && Array.isArray(content.education)) {
          setEducation(content.education.map((edu) => ({
            institution: edu.institution || '',
            studyType: edu.studyType || '',
            area: edu.area || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            gpa: edu.gpa || '',
            details: Array.isArray(edu.details) ? edu.details : []
          })))
        }

        // Load skills
        if (content.skills) {
          if (Array.isArray(content.skills)) {
            setSkills(content.skills.map((skill) => ({
              name: skill.name || '',
              keywords: Array.isArray(skill.keywords) ? skill.keywords : []
            })))
          } else if (typeof content.skills === 'object') {
            // Legacy format: skills as object with category keys
            const skillsObj = content.skills as Record<string, unknown>
            setSkills(Object.entries(skillsObj).map(([name, keywords]) => ({
              name,
              keywords: Array.isArray(keywords) ? keywords as string[] : []
            })))
          }
        }

        // Load projects
        if (content.projects && Array.isArray(content.projects)) {
          setProjects(content.projects.map((proj) => ({
            name: proj.name || '',
            description: proj.description || '',
            url: proj.url || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
            highlights: Array.isArray(proj.highlights) ? proj.highlights : []
          })))
        }

        // Load certifications
        const certs = content.certifications || content.certificates
        if (certs && Array.isArray(certs)) {
          setCertifications(certs.map((cert) => ({
            name: cert.name || '',
            issuer: cert.issuer || '',
            date: cert.date || ''
          })))
        }

        // Load awards
        if (content.awards && Array.isArray(content.awards)) {
          setAwards(content.awards.map((award) => ({
            title: award.title || '',
            date: award.date || '',
            awarder: award.awarder || '',
            summary: award.summary || ''
          })))
        }

        // Load volunteer
        if (content.volunteer && Array.isArray(content.volunteer)) {
          setVolunteer(content.volunteer.map((vol) => ({
            organization: vol.organization || '',
            position: vol.position || '',
            startDate: vol.startDate || '',
            endDate: vol.endDate || '',
            summary: vol.summary || '',
            highlights: Array.isArray(vol.highlights) ? vol.highlights : []
          })))
        }

        // Load publications
        if (content.publications && Array.isArray(content.publications)) {
          setPublications(content.publications.map((pub) => ({
            name: pub.name || '',
            publisher: pub.publisher || '',
            releaseDate: pub.releaseDate || '',
            url: pub.url || '',
            summary: pub.summary || ''
          })))
        }

        // Load languages
        if (content.languages && Array.isArray(content.languages)) {
          setLanguages(content.languages.map((lang) => ({
            language: lang.language || '',
            fluency: lang.fluency || ''
          })))
        }
      }
    } catch (err) {
      setError('Failed to load resume')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id || !resume) return

    try {
      setSaving(true)
      
      // Build updatedContent from scratch using only form data
      // Don't copy original content to avoid including fields not in the form
      const updatedContent: ResumeContent = {}
      
      // Update basics - only include non-empty fields, but ensure name exists
      updatedContent.basics = {}
      // Name is required - always set it, default to 'Resume' if empty
      const nameValue = basics.name?.trim() || 'Resume'
      updatedContent.basics.name = nameValue
      if (basics.email?.trim()) updatedContent.basics.email = basics.email.trim()
      if (basics.phone?.trim()) updatedContent.basics.phone = basics.phone.trim()
      if (basics.location?.trim()) updatedContent.basics.location = basics.location.trim()
      if (basics.website?.trim()) updatedContent.basics.website = basics.website.trim()
      if (basics.summary?.trim()) updatedContent.basics.summary = basics.summary.trim()

      // Update work - filter out empty entries and ensure valid structure
      const validWork = work
        .filter(w => w.name && w.position) // Only include entries with name and position
        .map(w => ({
          name: w.name,
          position: w.position,
          ...(w.location && { location: w.location }),
          ...(w.startDate && { startDate: w.startDate }),
          ...(w.endDate && { endDate: w.endDate }),
          ...(w.summary && { summary: w.summary }),
          highlights: w.highlights.filter(h => h.trim()).filter(h => h.length > 0) // Remove empty highlights
        }))
      if (validWork.length > 0) {
        updatedContent.work = validWork
      }

      // Update education - filter out empty entries
      const validEducation = education
        .filter(e => e.institution) // Only include entries with institution
        .map(e => ({
          institution: e.institution,
          ...(e.studyType && { studyType: e.studyType }),
          ...(e.area && { area: e.area }),
          ...(e.startDate && { startDate: e.startDate }),
          ...(e.endDate && { endDate: e.endDate }),
          ...(e.gpa && { gpa: e.gpa }),
          details: e.details.filter(d => d.trim()).filter(d => d.length > 0) // Remove empty details
        }))
      if (validEducation.length > 0) {
        updatedContent.education = validEducation
      }

      // Update skills - filter out empty entries
      const validSkills = skills
        .filter(s => s.name && s.keywords.length > 0) // Only include categories with name and keywords
        .map(s => ({
          name: s.name,
          keywords: s.keywords.filter(k => k.trim()).filter(k => k.length > 0) // Remove empty keywords
        }))
      if (validSkills.length > 0) {
        updatedContent.skills = validSkills
      }

      // Update projects - filter out empty entries
      const validProjects = projects
        .filter(p => p.name) // Only include entries with name
        .map(p => ({
          name: p.name,
          ...(p.description && { description: p.description }),
          ...(p.url && { url: p.url }),
          ...(p.startDate && { startDate: p.startDate }),
          ...(p.endDate && { endDate: p.endDate }),
          highlights: p.highlights.filter(h => h.trim()).filter(h => h.length > 0) // Remove empty highlights
        }))
      if (validProjects.length > 0) {
        updatedContent.projects = validProjects
      }

      // Update certifications - filter out empty entries
      const validCertifications = certifications
        .filter(c => c.name) // Only include entries with name
        .map(c => ({
          name: c.name,
          ...(c.issuer && { issuer: c.issuer }),
          ...(c.date && { date: c.date })
        }))
      if (validCertifications.length > 0) {
        updatedContent.certifications = validCertifications
      }

      // Update awards - filter out empty entries
      const validAwards = awards
        .filter(a => a.title) // Only include entries with title
        .map(a => ({
          title: a.title,
          ...(a.date && { date: a.date }),
          ...(a.awarder && { awarder: a.awarder }),
          ...(a.summary && { summary: a.summary })
        }))
      if (validAwards.length > 0) {
        updatedContent.awards = validAwards
      }

      // Update volunteer - filter out empty entries
      const validVolunteer = volunteer
        .filter(v => v.organization) // Only include entries with organization
        .map(v => ({
          organization: v.organization,
          ...(v.position && { position: v.position }),
          ...(v.startDate && { startDate: v.startDate }),
          ...(v.endDate && { endDate: v.endDate }),
          ...(v.summary && { summary: v.summary }),
          highlights: v.highlights.filter(h => h.trim()).filter(h => h.length > 0)
        }))
      if (validVolunteer.length > 0) {
        updatedContent.volunteer = validVolunteer
      }

      // Update publications - filter out empty entries
      const validPublications = publications
        .filter(p => p.name) // Only include entries with name
        .map(p => ({
          name: p.name,
          ...(p.publisher && { publisher: p.publisher }),
          ...(p.releaseDate && { releaseDate: p.releaseDate }),
          ...(p.url && { url: p.url }),
          ...(p.summary && { summary: p.summary })
        }))
      if (validPublications.length > 0) {
        updatedContent.publications = validPublications
      }

      // Update languages - filter out empty entries
      const validLanguages = languages
        .filter(l => l.language) // Only include entries with language
        .map(l => ({
          language: l.language,
          ...(l.fluency && { fluency: l.fluency })
        }))
      if (validLanguages.length > 0) {
        updatedContent.languages = validLanguages
      }

      // Update resume name if it changed
      await resumeService.updateResume(id, {
        name: resumeName,
        content: updatedContent
      })

      // Regenerate PDF and update history entry if it exists
      // IMPORTANT: Do this BEFORE loadResume to avoid state overwrite issues
      try {
        // Find associated history entry (use state if available, otherwise fetch)
        const currentHistoryItem = historyItem || await getHistoryItemByResumeId(id)
        
        // Convert resume to PDF using the updatedContent we just saved
        const convertResult = await resumeService.convertResumeToPdf(
          updatedContent,
          resumeName
        )
        
        // Update history entry with new download URL and file_name if it exists
        if (currentHistoryItem) {
          const newDownloadUrl = convertResult.storage.public_url || convertResult.storage.url

          // Use the returned value from updateHistoryItem to preserve all fields including match_results
          const updatedHistoryItem = await updateHistoryItem(currentHistoryItem.id, {
            download_url: newDownloadUrl,
            file_name: resumeName
          })

          // Update local state with the full returned item (preserves match_results)
          setHistoryItem(updatedHistoryItem)
          
          addNotification({
            title: 'Resume Updated',
            message: 'Your resume has been saved and regenerated. The new PDF is available in your history.',
            type: 'success'
          })
        } else {
          // No history entry, but PDF was still generated
          addNotification({
            title: 'Resume Saved',
            message: 'Your resume has been saved successfully.',
            type: 'success'
          })
        }
      } catch (convertErr) {
        // Don't block save operation if convert fails
        console.error('Failed to regenerate PDF:', convertErr)
        addNotification({
          title: 'Resume Saved',
          message: 'Your resume has been saved, but PDF regeneration failed. You can try again later.',
          type: 'warning'
        })
      }
      
      // Reload resume from DB after PDF generation to sync UI state
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

  // Helper functions for managing arrays
  const addWorkEntry = () => {
    setWork([...work, { name: '', position: '', highlights: [] }])
    expandSection('work')
  }

  const updateWorkEntry = (index: number, field: keyof WorkEntry, value: string | string[]) => {
    const updated = [...work]
    updated[index] = { ...updated[index], [field]: value }
    setWork(updated)
  }

  const removeWorkEntry = (index: number) => {
    setWork(work.filter((_, i) => i !== index))
  }

  const addHighlight = (index: number) => {
    const updated = [...work]
    updated[index].highlights = [...updated[index].highlights, '']
    setWork(updated)
  }

  const updateHighlight = (workIndex: number, highlightIndex: number, value: string) => {
    const updated = [...work]
    updated[workIndex].highlights[highlightIndex] = value
    setWork(updated)
  }

  const removeHighlight = (workIndex: number, highlightIndex: number) => {
    const updated = [...work]
    updated[workIndex].highlights = updated[workIndex].highlights.filter((_, i) => i !== highlightIndex)
    setWork(updated)
  }

  const addEducationEntry = () => {
    setEducation([...education, { institution: '', details: [] }])
    expandSection('education')
  }

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: string | string[]) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
  }

  const removeEducationEntry = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const addEducationDetail = (index: number) => {
    const updated = [...education]
    updated[index].details = [...updated[index].details, '']
    setEducation(updated)
  }

  const updateEducationDetail = (eduIndex: number, detailIndex: number, value: string) => {
    const updated = [...education]
    updated[eduIndex].details[detailIndex] = value
    setEducation(updated)
  }

  const removeEducationDetail = (eduIndex: number, detailIndex: number) => {
    const updated = [...education]
    updated[eduIndex].details = updated[eduIndex].details.filter((_, i) => i !== detailIndex)
    setEducation(updated)
  }

  const addSkillCategory = () => {
    setSkills([...skills, { name: '', keywords: [] }])
    expandSection('skills')
  }

  const updateSkillCategory = (index: number, field: keyof SkillCategory, value: string | string[]) => {
    const updated = [...skills]
    updated[index] = { ...updated[index], [field]: value }
    setSkills(updated)
  }

  const removeSkillCategory = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const addSkillKeyword = (index: number) => {
    const updated = [...skills]
    updated[index].keywords = [...updated[index].keywords, '']
    setSkills(updated)
  }

  const updateSkillKeyword = (skillIndex: number, keywordIndex: number, value: string) => {
    const updated = [...skills]
    updated[skillIndex].keywords[keywordIndex] = value
    setSkills(updated)
  }

  const removeSkillKeyword = (skillIndex: number, keywordIndex: number) => {
    const updated = [...skills]
    updated[skillIndex].keywords = updated[skillIndex].keywords.filter((_, i) => i !== keywordIndex)
    setSkills(updated)
  }

  const addProjectEntry = () => {
    setProjects([...projects, { name: '', highlights: [] }])
    expandSection('projects')
  }

  const updateProjectEntry = (index: number, field: keyof ProjectEntry, value: string | string[]) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const removeProjectEntry = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const addProjectHighlight = (index: number) => {
    const updated = [...projects]
    updated[index].highlights = [...updated[index].highlights, '']
    setProjects(updated)
  }

  const updateProjectHighlight = (projIndex: number, highlightIndex: number, value: string) => {
    const updated = [...projects]
    updated[projIndex].highlights[highlightIndex] = value
    setProjects(updated)
  }

  const removeProjectHighlight = (projIndex: number, highlightIndex: number) => {
    const updated = [...projects]
    updated[projIndex].highlights = updated[projIndex].highlights.filter((_, i) => i !== highlightIndex)
    setProjects(updated)
  }

  const addCertificationEntry = () => {
    setCertifications([...certifications, { name: '' }])
    expandSection('certifications')
  }

  const updateCertificationEntry = (index: number, field: keyof CertificationEntry, value: string) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const removeCertificationEntry = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  // Award handlers
  const addAwardEntry = () => {
    setAwards([...awards, { title: '' }])
    expandSection('awards')
  }

  const updateAwardEntry = (index: number, field: keyof AwardEntry, value: string) => {
    const updated = [...awards]
    updated[index] = { ...updated[index], [field]: value }
    setAwards(updated)
  }

  const removeAwardEntry = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index))
  }

  // Volunteer handlers
  const addVolunteerEntry = () => {
    setVolunteer([...volunteer, { organization: '', highlights: [] }])
    expandSection('volunteer')
  }

  const updateVolunteerEntry = (index: number, field: keyof VolunteerEntry, value: string | string[]) => {
    const updated = [...volunteer]
    updated[index] = { ...updated[index], [field]: value }
    setVolunteer(updated)
  }

  const removeVolunteerEntry = (index: number) => {
    setVolunteer(volunteer.filter((_, i) => i !== index))
  }

  const addVolunteerHighlight = (index: number) => {
    const updated = [...volunteer]
    updated[index].highlights = [...updated[index].highlights, '']
    setVolunteer(updated)
  }

  const updateVolunteerHighlight = (volIndex: number, highlightIndex: number, value: string) => {
    const updated = [...volunteer]
    updated[volIndex].highlights[highlightIndex] = value
    setVolunteer(updated)
  }

  const removeVolunteerHighlight = (volIndex: number, highlightIndex: number) => {
    const updated = [...volunteer]
    updated[volIndex].highlights = updated[volIndex].highlights.filter((_, i) => i !== highlightIndex)
    setVolunteer(updated)
  }

  // Publication handlers
  const addPublicationEntry = () => {
    setPublications([...publications, { name: '' }])
    expandSection('publications')
  }

  const updatePublicationEntry = (index: number, field: keyof PublicationEntry, value: string) => {
    const updated = [...publications]
    updated[index] = { ...updated[index], [field]: value }
    setPublications(updated)
  }

  const removePublicationEntry = (index: number) => {
    setPublications(publications.filter((_, i) => i !== index))
  }

  // Language handlers
  const addLanguageEntry = () => {
    setLanguages([...languages, { language: '' }])
    expandSection('languages')
  }

  const updateLanguageEntry = (index: number, field: keyof LanguageEntry, value: string) => {
    const updated = [...languages]
    updated[index] = { ...updated[index], [field]: value }
    setLanguages(updated)
  }

  const removeLanguageEntry = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  // AI Edit handlers
  const handleAIEdit = (
    type: 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight',
    fieldLabel: string,
    currentText: string,
    workIndex?: number,
    highlightIndex?: number,
    educationIndex?: number,
    detailIndex?: number,
    projectIndex?: number
  ) => {
    setEditingField({
      type,
      workIndex,
      highlightIndex,
      educationIndex,
      detailIndex,
      projectIndex,
      fieldLabel,
      currentText: currentText || ''
    })
    setAiDialogOpen(true)
  }

  const handleAIEditApply = (editedText: string) => {
    if (!editingField) return

    switch (editingField.type) {
      case 'basics_summary':
        setBasics({ ...basics, summary: editedText })
        break
      
      case 'work_summary':
        if (editingField.workIndex !== undefined) {
          const updated = [...work]
          updated[editingField.workIndex] = {
            ...updated[editingField.workIndex],
            summary: editedText
          }
          setWork(updated)
        }
        break
      
      case 'work_highlight':
        if (editingField.workIndex !== undefined && editingField.highlightIndex !== undefined) {
          const updated = [...work]
          updated[editingField.workIndex].highlights[editingField.highlightIndex] = editedText
          setWork(updated)
        }
        break
      
      case 'education_detail':
        if (editingField.educationIndex !== undefined && editingField.detailIndex !== undefined) {
          const updated = [...education]
          updated[editingField.educationIndex].details[editingField.detailIndex] = editedText
          setEducation(updated)
        }
        break
      
      case 'project_description':
        if (editingField.projectIndex !== undefined) {
          const updated = [...projects]
          updated[editingField.projectIndex] = {
            ...updated[editingField.projectIndex],
            description: editedText
          }
          setProjects(updated)
        }
        break
      
      case 'project_highlight':
        if (editingField.projectIndex !== undefined && editingField.highlightIndex !== undefined) {
          const updated = [...projects]
          updated[editingField.projectIndex].highlights[editingField.highlightIndex] = editedText
          setProjects(updated)
        }
        break
    }

    setEditingField(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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

  // Helper function to get match score color
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
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
      <div className="mb-4 sm:mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Resume Name Editor */}
          <div className="flex items-center gap-2 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onBlur={() => {
                    setResumeName(editingNameValue)
                    setIsEditingName(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setResumeName(editingNameValue)
                      setIsEditingName(false)
                    } else if (e.key === 'Escape') {
                      setEditingNameValue(resumeName)
                      setIsEditingName(false)
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResumeName(editingNameValue)
                    setIsEditingName(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {resumeName || resume.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNameValue(resumeName || resume.name)
                    setIsEditingName(true)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {historyItem?.download_url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(historyItem.download_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
              </>
            )}
            <div data-tour="save-button">
              <Tooltip content="Save changes and regenerate PDF">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="flex items-center gap-2 sm:size-default"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Save Changes</span>
                    </>
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Toggle Button - only on <lg */}
        <button
          onClick={() => setMatchPanelOpen(!matchPanelOpen)}
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          aria-label={matchPanelOpen ? "Close match panel" : "Open match panel"}
        >
          <Target className="h-5 w-5" />
          {matchPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 -rotate-90" />
          )}
        </button>

        {/* Backdrop (when panel open on mobile/tablet) */}
        {matchPanelOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setMatchPanelOpen(false)}
          />
        )}

        {/* Main Editor Column - full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0 space-y-8">
        {/* Basics Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex items-center gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('basics')}
          >
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
            <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('basics') ? '' : '-rotate-90'}`} />
          </div>
          {expandedSections.has('basics') && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={basics.name}
                onChange={(e) => setBasics({ ...basics, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={basics.email}
                onChange={(e) => setBasics({ ...basics, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={basics.phone}
                onChange={(e) => setBasics({ ...basics, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={basics.location}
                onChange={(e) => setBasics({ ...basics, location: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website / LinkedIn</Label>
              <Input
                id="website"
                value={basics.website}
                onChange={(e) => setBasics({ ...basics, website: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2" data-tour="summary-field">
              <div className="flex items-center justify-between">
                <Label htmlFor="summary" className="flex items-center gap-2">
                  Professional Summary
                  <Tooltip content="2-3 sentences of key qualifications">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </Tooltip>
                </Label>
                <div data-tour="ai-edit-button">
                  <Tooltip content="Use AI to improve this text">
                    <ProButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAIEdit('basics_summary', 'Professional Summary', basics.summary)}
                      className="h-8 px-2"
                      featureName="AI Edit"
                      featureDescription="Use AI to improve your professional summary. Get intelligent suggestions to make your resume stand out."
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Edit
                    </ProButton>
                  </Tooltip>
                </div>
              </div>
              <Textarea
                id="summary"
                rows={4}
                value={basics.summary}
                onChange={(e) => setBasics({ ...basics, summary: e.target.value })}
              />
            </div>
          </div>
          )}
        </section>

        {/* Experience Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('work')}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Experience</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('work') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addWorkEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Experience</span>
            </Button>
          </div>
          {expandedSections.has('work') && (
          <>
          {work.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No experience entries yet. Click "Add Experience" to get started.</p>
          ) : (
            <div className="space-y-6">
              {work.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Experience #{index + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => removeWorkEntry(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={entry.name}
                        onChange={(e) => updateWorkEntry(index, 'name', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={entry.position}
                        onChange={(e) => updateWorkEntry(index, 'position', e.target.value)}
                        placeholder="Job title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={entry.location || ''}
                        onChange={(e) => updateWorkEntry(index, 'location', e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={entry.startDate || ''}
                        onChange={(e) => updateWorkEntry(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={entry.endDate === 'Present' ? '' : (entry.endDate || '')}
                          onChange={(e) => updateWorkEntry(index, 'endDate', e.target.value)}
                          disabled={entry.endDate === 'Present'}
                          className={entry.endDate === 'Present' ? 'opacity-50' : ''}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.endDate === 'Present'}
                            onChange={(e) => updateWorkEntry(index, 'endDate', e.target.checked ? 'Present' : '')}
                            className="rounded border-slate-300 dark:border-slate-600"
                          />
                          Present
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Summary</Label>
                        <ProButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('work_summary', `Work Summary - ${entry.name}`, entry.summary || '', index)}
                          className="h-8 px-2"
                          featureName="AI Edit"
                          featureDescription="Use AI to enhance your work summary. Get suggestions to better highlight your achievements."
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Edit
                        </ProButton>
                      </div>
                      <Textarea
                        value={entry.summary || ''}
                        onChange={(e) => updateWorkEntry(index, 'summary', e.target.value)}
                        rows={2}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Highlights</Label>
                      <Button variant="ghost" size="sm" onClick={() => addHighlight(index)}>
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {entry.highlights.map((highlight, hIndex) => (
                      <div key={hIndex} className="flex gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => updateHighlight(index, hIndex, e.target.value)}
                          placeholder="Bullet point"
                        />
                        <ProButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('work_highlight', `Work Highlight - ${entry.name}`, highlight, index, hIndex)}
                          className="h-8 px-2"
                          featureName="AI Edit"
                          featureDescription="Use AI to improve this bullet point. Make your achievements more impactful."
                        >
                          <Sparkles className="h-4 w-4" />
                        </ProButton>
                        <Button variant="ghost" size="sm" onClick={() => removeHighlight(index, hIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Education Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('education')}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Education</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('education') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addEducationEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Education</span>
            </Button>
          </div>
          {expandedSections.has('education') && (
          <>
          {education.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No education entries yet. Click "Add Education" to get started.</p>
          ) : (
            <div className="space-y-6">
              {education.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Education #{index + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => removeEducationEntry(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={entry.institution}
                        onChange={(e) => updateEducationEntry(index, 'institution', e.target.value)}
                        placeholder="School name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree Type</Label>
                      <Input
                        value={entry.studyType || ''}
                        onChange={(e) => updateEducationEntry(index, 'studyType', e.target.value)}
                        placeholder="Bachelor's, Master's, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Area of Study</Label>
                      <Input
                        value={entry.area || ''}
                        onChange={(e) => updateEducationEntry(index, 'area', e.target.value)}
                        placeholder="Major or field"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={entry.startDate || ''}
                        onChange={(e) => updateEducationEntry(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={entry.endDate === 'Present' ? '' : (entry.endDate || '')}
                          onChange={(e) => updateEducationEntry(index, 'endDate', e.target.value)}
                          disabled={entry.endDate === 'Present'}
                          className={entry.endDate === 'Present' ? 'opacity-50' : ''}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.endDate === 'Present'}
                            onChange={(e) => updateEducationEntry(index, 'endDate', e.target.checked ? 'Present' : '')}
                            className="rounded border-slate-300 dark:border-slate-600"
                          />
                          Present
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GPA</Label>
                      <Input
                        value={entry.gpa || ''}
                        onChange={(e) => updateEducationEntry(index, 'gpa', e.target.value)}
                        placeholder="3.5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Details</Label>
                      <Button variant="ghost" size="sm" onClick={() => addEducationDetail(index)}>
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {entry.details.map((detail, dIndex) => (
                      <div key={dIndex} className="flex gap-2">
                        <Input
                          value={detail}
                          onChange={(e) => updateEducationDetail(index, dIndex, e.target.value)}
                          placeholder="Coursework, honors, thesis, etc."
                        />
                        <ProButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('education_detail', `Education Detail - ${entry.institution}`, detail, undefined, undefined, index, dIndex)}
                          className="h-8 px-2"
                          featureName="AI Edit"
                          featureDescription="Use AI to enhance your education details. Highlight your academic achievements."
                        >
                          <Sparkles className="h-4 w-4" />
                        </ProButton>
                        <Button variant="ghost" size="sm" onClick={() => removeEducationDetail(index, dIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Skills Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('skills')}
          >
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Skills</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('skills') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addSkillCategory(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>
          {expandedSections.has('skills') && (
          <>
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No skill categories yet. Click "Add Category" to get started.</p>
          ) : (
            <div className="space-y-6">
              {skills.map((category, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Label>Category Name</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateSkillCategory(index, 'name', e.target.value)}
                        placeholder="e.g., Programming Languages, Tools, etc."
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSkillCategory(index)} className="ml-4">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Skills</Label>
                      <Button variant="ghost" size="sm" onClick={() => addSkillKeyword(index)}>
                        <Plus className="mr-1 h-3 w-3" /> Add Skill
                      </Button>
                    </div>
                    {category.keywords.map((keyword, kIndex) => (
                      <div key={kIndex} className="flex gap-2">
                        <Input
                          value={keyword}
                          onChange={(e) => updateSkillKeyword(index, kIndex, e.target.value)}
                          placeholder="Skill name"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeSkillKeyword(index, kIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Projects Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('projects')}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('projects') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addProjectEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Project</span>
            </Button>
          </div>
          {expandedSections.has('projects') && (
          <>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No projects yet. Click "Add Project" to get started.</p>
          ) : (
            <div className="space-y-6">
              {projects.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Project #{index + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => removeProjectEntry(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={entry.name}
                        onChange={(e) => updateProjectEntry(index, 'name', e.target.value)}
                        placeholder="Project name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={entry.url || ''}
                        onChange={(e) => updateProjectEntry(index, 'url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={entry.startDate || ''}
                        onChange={(e) => updateProjectEntry(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={entry.endDate === 'Present' ? '' : (entry.endDate || '')}
                          onChange={(e) => updateProjectEntry(index, 'endDate', e.target.value)}
                          disabled={entry.endDate === 'Present'}
                          className={entry.endDate === 'Present' ? 'opacity-50' : ''}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.endDate === 'Present'}
                            onChange={(e) => updateProjectEntry(index, 'endDate', e.target.checked ? 'Present' : '')}
                            className="rounded border-slate-300 dark:border-slate-600"
                          />
                          Present
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Description</Label>
                        <ProButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('project_description', `Project Description - ${entry.name}`, entry.description || '', undefined, undefined, undefined, undefined, index)}
                          className="h-8 px-2"
                          featureName="AI Edit"
                          featureDescription="Use AI to improve your project description. Highlight the impact and technologies used."
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Edit
                        </ProButton>
                      </div>
                      <Textarea
                        value={entry.description || ''}
                        onChange={(e) => updateProjectEntry(index, 'description', e.target.value)}
                        rows={2}
                        placeholder="Project description"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Highlights</Label>
                      <Button variant="ghost" size="sm" onClick={() => addProjectHighlight(index)}>
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {entry.highlights.map((highlight, hIndex) => (
                      <div key={hIndex} className="flex gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => updateProjectHighlight(index, hIndex, e.target.value)}
                          placeholder="Bullet point"
                        />
                        <ProButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('project_highlight', `Project Highlight - ${entry.name}`, highlight, undefined, hIndex, undefined, undefined, index)}
                          className="h-8 px-2"
                          featureName="AI Edit"
                          featureDescription="Use AI to enhance this bullet point. Make your contributions stand out."
                        >
                          <Sparkles className="h-4 w-4" />
                        </ProButton>
                        <Button variant="ghost" size="sm" onClick={() => removeProjectHighlight(index, hIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Certifications Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('certifications')}
          >
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Certifications</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('certifications') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addCertificationEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Certification</span>
            </Button>
          </div>
          {expandedSections.has('certifications') && (
          <>
          {certifications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No certifications yet. Click "Add Certification" to get started.</p>
          ) : (
            <div className="space-y-4">
              {certifications.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-4 md:grid-cols-3 flex-1">
                      <div className="space-y-2">
                        <Label>Certification Name</Label>
                        <Input
                          value={entry.name}
                          onChange={(e) => updateCertificationEntry(index, 'name', e.target.value)}
                          placeholder="Certification name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Issuer</Label>
                        <Input
                          value={entry.issuer || ''}
                          onChange={(e) => updateCertificationEntry(index, 'issuer', e.target.value)}
                          placeholder="Issuing organization"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={entry.date || ''}
                          onChange={(e) => updateCertificationEntry(index, 'date', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeCertificationEntry(index)} className="ml-4">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Awards Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('awards')}
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Awards & Honors</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('awards') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addAwardEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Award</span>
            </Button>
          </div>
          {expandedSections.has('awards') && (
          <>
          {awards.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No awards yet. Click "Add Award" to get started.</p>
          ) : (
            <div className="space-y-4">
              {awards.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-4 md:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label>Award Title</Label>
                        <Input
                          value={entry.title}
                          onChange={(e) => updateAwardEntry(index, 'title', e.target.value)}
                          placeholder="Award name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Awarder</Label>
                        <Input
                          value={entry.awarder || ''}
                          onChange={(e) => updateAwardEntry(index, 'awarder', e.target.value)}
                          placeholder="Organization"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={entry.date || ''}
                          onChange={(e) => updateAwardEntry(index, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Summary</Label>
                        <Textarea
                          value={entry.summary || ''}
                          onChange={(e) => updateAwardEntry(index, 'summary', e.target.value)}
                          rows={2}
                          placeholder="Brief description of the award"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAwardEntry(index)} className="ml-4">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Volunteer Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('volunteer')}
          >
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Volunteer Experience</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('volunteer') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addVolunteerEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Volunteer</span>
            </Button>
          </div>
          {expandedSections.has('volunteer') && (
          <>
          {volunteer.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No volunteer experience yet. Click "Add Volunteer" to get started.</p>
          ) : (
            <div className="space-y-6">
              {volunteer.map((entry, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Volunteer #{index + 1}</h3>
                    <Button variant="ghost" size="sm" onClick={() => removeVolunteerEntry(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Input
                        value={entry.organization}
                        onChange={(e) => updateVolunteerEntry(index, 'organization', e.target.value)}
                        placeholder="Organization name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        value={entry.position || ''}
                        onChange={(e) => updateVolunteerEntry(index, 'position', e.target.value)}
                        placeholder="Your role"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={entry.startDate || ''}
                        onChange={(e) => updateVolunteerEntry(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={entry.endDate === 'Present' ? '' : (entry.endDate || '')}
                          onChange={(e) => updateVolunteerEntry(index, 'endDate', e.target.value)}
                          disabled={entry.endDate === 'Present'}
                          className={entry.endDate === 'Present' ? 'opacity-50' : ''}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.endDate === 'Present'}
                            onChange={(e) => updateVolunteerEntry(index, 'endDate', e.target.checked ? 'Present' : '')}
                            className="rounded border-slate-300 dark:border-slate-600"
                          />
                          Present
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Summary</Label>
                      <Textarea
                        value={entry.summary || ''}
                        onChange={(e) => updateVolunteerEntry(index, 'summary', e.target.value)}
                        rows={2}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Highlights</Label>
                      <Button variant="ghost" size="sm" onClick={() => addVolunteerHighlight(index)}>
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {entry.highlights.map((highlight, hIndex) => (
                      <div key={hIndex} className="flex gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => updateVolunteerHighlight(index, hIndex, e.target.value)}
                          placeholder="Bullet point"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeVolunteerHighlight(index, hIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Publications Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('publications')}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Publications</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('publications') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addPublicationEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Publication</span>
            </Button>
          </div>
          {expandedSections.has('publications') && (
          <>
          {publications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No publications yet. Click "Add Publication" to get started.</p>
          ) : (
            <div className="space-y-4">
              {publications.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-4 md:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={entry.name}
                          onChange={(e) => updatePublicationEntry(index, 'name', e.target.value)}
                          placeholder="Publication title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Publisher</Label>
                        <Input
                          value={entry.publisher || ''}
                          onChange={(e) => updatePublicationEntry(index, 'publisher', e.target.value)}
                          placeholder="Journal, conference, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Release Date</Label>
                        <Input
                          type="date"
                          value={entry.releaseDate || ''}
                          onChange={(e) => updatePublicationEntry(index, 'releaseDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={entry.url || ''}
                          onChange={(e) => updatePublicationEntry(index, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Summary</Label>
                        <Textarea
                          value={entry.summary || ''}
                          onChange={(e) => updatePublicationEntry(index, 'summary', e.target.value)}
                          rows={2}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removePublicationEntry(index)} className="ml-4">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

        {/* Languages Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 sm:p-6">
          <div
            className="flex flex-wrap items-center justify-between gap-2 mb-4 cursor-pointer select-none"
            onClick={() => toggleSection('languages')}
          >
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Languages</h2>
              <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${expandedSections.has('languages') ? '' : '-rotate-90'}`} />
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addLanguageEntry(); }}>
              <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add Language</span>
            </Button>
          </div>
          {expandedSections.has('languages') && (
          <>
          {languages.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No languages yet. Click "Add Language" to get started.</p>
          ) : (
            <div className="space-y-4">
              {languages.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-4 md:grid-cols-2 flex-1">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Input
                          value={entry.language}
                          onChange={(e) => updateLanguageEntry(index, 'language', e.target.value)}
                          placeholder="Language name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fluency</Label>
                        <Input
                          value={entry.fluency || ''}
                          onChange={(e) => updateLanguageEntry(index, 'fluency', e.target.value)}
                          placeholder="Native, Fluent, Intermediate, etc."
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeLanguageEntry(index)} className="ml-4">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </section>

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

        {/* Desktop: Static sidebar - always visible on lg+ */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Match History</h3>
              </div>
              <ProButton
                variant="outline"
                size="sm"
                onClick={() => setNewMatchDialogOpen(true)}
                disabled={isRetailoring}
                featureName="Job Match Analysis"
                featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </ProButton>
            </div>

            {historyItem?.match_results ? (
              <div className="space-y-4">
                {/* Match Score */}
                <div className={`rounded-lg p-4 ${getMatchBgColor(historyItem.match_results.match_percentage)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score</span>
                    <span className={`text-2xl font-bold ${getMatchColor(historyItem.match_results.match_percentage)}`}>
                      {historyItem.match_results.match_percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Matched {new Date(historyItem.match_results.matched_at).toLocaleDateString()} at {new Date(historyItem.match_results.matched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <ProButton
                    size="sm"
                    className="w-full"
                    disabled={isRetailoring || (!historyItem?.job_json && !currentJobData)}
                    onClick={handleRetailor}
                    featureName="Resume Tailoring"
                    featureDescription="Automatically tailor your resume to match the job description. AI-powered optimization for better results."
                  >
                    {isRetailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Retailor Resume
                      </>
                    )}
                  </ProButton>
                  <ProButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!historyItem?.match_results?.recommendations?.length || isRetailoring}
                    onClick={() => setRecommendationsDialogOpen(true)}
                    featureName="Apply Recommendations"
                    featureDescription="Let AI apply the recommended changes to your resume. Quickly implement improvements."
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Apply Recommendations
                  </ProButton>
                  {historyItem?.job_json && (
                    <div data-tour="quick-rematch-button">
                      <Tooltip content="Re-analyze with same job description">
                        <ProButton
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={isRematching || isRetailoring}
                          onClick={handleQuickRematch}
                          featureName="Rematch Analysis"
                          featureDescription="Re-analyze your resume against the same job. See how your changes improved your match score."
                        >
                          {isRematching ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Rematching...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Rematch
                            </>
                          )}
                        </ProButton>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Strengths - Collapsible */}
                {historyItem.match_results.strengths.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('strengths')}
                      className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.strengths ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Strengths</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.strengths.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.strengths && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.strengths.map((strength, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Gaps - Collapsible */}
                {historyItem.match_results.gaps.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('gaps')}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.gaps ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Gaps</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.gaps.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.gaps && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.gaps.map((gap, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {gap}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Recommendations - Collapsible */}
                {historyItem.match_results.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('recommendations')}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.recommendations ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-sm font-semibold">Recommendations</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.recommendations.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.recommendations && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No match analysis yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Run a match analysis to see strengths, gaps, and recommendations.
                </p>
                <ProButton
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMatchDialogOpen(true)}
                  disabled={isRetailoring}
                  featureName="Job Match Analysis"
                  featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start New Match
                </ProButton>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Slide-out drawer - only on <lg */}
        <div className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          matchPanelOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="h-full overflow-y-auto p-4">
            {/* Close button */}
            <button
              onClick={() => setMatchPanelOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close match panel"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between mb-4 pr-8">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Match History</h3>
              </div>
              <ProButton
                variant="outline"
                size="sm"
                onClick={() => setNewMatchDialogOpen(true)}
                disabled={isRetailoring}
                featureName="Job Match Analysis"
                featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </ProButton>
            </div>

            {historyItem?.match_results ? (
              <div className="space-y-4">
                {/* Match Score */}
                <div className={`rounded-lg p-4 ${getMatchBgColor(historyItem.match_results.match_percentage)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score</span>
                    <span className={`text-2xl font-bold ${getMatchColor(historyItem.match_results.match_percentage)}`}>
                      {historyItem.match_results.match_percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Matched {new Date(historyItem.match_results.matched_at).toLocaleDateString()} at {new Date(historyItem.match_results.matched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <ProButton
                    size="sm"
                    className="w-full"
                    disabled={isRetailoring || (!historyItem?.job_json && !currentJobData)}
                    onClick={handleRetailor}
                    featureName="Resume Tailoring"
                    featureDescription="Automatically tailor your resume to match the job description. AI-powered optimization for better results."
                  >
                    {isRetailoring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Retailor Resume
                      </>
                    )}
                  </ProButton>
                  <ProButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!historyItem?.match_results?.recommendations?.length || isRetailoring}
                    onClick={() => setRecommendationsDialogOpen(true)}
                    featureName="Apply Recommendations"
                    featureDescription="Let AI apply the recommended changes to your resume. Quickly implement improvements."
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Apply Recommendations
                  </ProButton>
                  {historyItem?.job_json && (
                    <div data-tour="quick-rematch-button">
                      <Tooltip content="Re-analyze with same job description">
                        <ProButton
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={isRematching || isRetailoring}
                          onClick={handleQuickRematch}
                          featureName="Rematch Analysis"
                          featureDescription="Re-analyze your resume against the same job. See how your changes improved your match score."
                        >
                          {isRematching ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Rematching...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Rematch
                            </>
                          )}
                        </ProButton>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Strengths - Collapsible */}
                {historyItem.match_results.strengths.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('strengths')}
                      className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.strengths ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Strengths</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.strengths.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.strengths && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.strengths.map((strength, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Gaps - Collapsible */}
                {historyItem.match_results.gaps.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('gaps')}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.gaps ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Gaps</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.gaps.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.gaps && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.gaps.map((gap, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {gap}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Recommendations - Collapsible */}
                {historyItem.match_results.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleMatchSection('recommendations')}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-full text-left"
                    >
                      {matchSectionsExpanded.recommendations ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Lightbulb className="h-4 w-4" />
                      <span className="text-sm font-semibold">Recommendations</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ({historyItem.match_results.recommendations.length})
                      </span>
                    </button>
                    {matchSectionsExpanded.recommendations && (
                      <ul className="space-y-1.5 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {historyItem.match_results.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No match analysis yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Run a match analysis to see strengths, gaps, and recommendations.
                </p>
                <ProButton
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMatchDialogOpen(true)}
                  disabled={isRetailoring}
                  featureName="Job Match Analysis"
                  featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start New Match
                </ProButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Edit Dialog */}
      {editingField && (
        <AIEditDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          originalText={editingField.currentText}
          fieldLabel={editingField.fieldLabel}
          onApply={handleAIEditApply}
        />
      )}

      {/* PDF Preview Modal */}
      <Dialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Resume Preview"
        className="max-w-5xl w-full h-[90vh]"
      >
        <div className="h-[calc(90vh-100px)] w-full">
          {historyItem?.download_url ? (
            <iframe
              src={historyItem.download_url}
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

      {/* Apply Recommendations Dialog */}
      {historyItem?.match_results?.recommendations && (
        <ApplyRecommendationsDialog
          open={recommendationsDialogOpen}
          onOpenChange={setRecommendationsDialogOpen}
          recommendations={historyItem.match_results.recommendations}
          sectionData={{
            summary: basics.summary,
            skills: skills,
            experience: work
          }}
          onApplySummary={(newSummary) => setBasics(prev => ({ ...prev, summary: newSummary }))}
          onApplySkills={(newSkills) => setSkills(newSkills)}
          onApplyExperience={(newWork) => setWork(newWork)}
          onRetailor={() => handleRetailor()}
        />
      )}

      {/* New Match Dialog */}
      <NewMatchDialog
        open={newMatchDialogOpen}
        onOpenChange={setNewMatchDialogOpen}
        resumeContent={resume?.content || buildResumeContent()}
        historyItemId={historyItem?.id}
        onMatchComplete={handleMatchComplete}
        onRetailor={handleRetailor}
      />

      {/* Guided Tour */}
      <GuidedTour tourId="editor" />
    </div>
  )
}
