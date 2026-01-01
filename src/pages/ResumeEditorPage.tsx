import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resumeService } from '@/services/resume'
import type { Resume } from '@/services/resume'
import { getHistoryItemByResumeId, updateHistoryItem } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save, ArrowLeft, Plus, Trash2, X, User, Briefcase, GraduationCap, Code, FolderKanban, Award, Sparkles } from 'lucide-react'
import { AIEditDialog } from '@/components/AIEditDialog'

// Type definitions
type WorkEntry = {
  name: string
  position: string
  location?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights: string[]
}

type EducationEntry = {
  institution: string
  studyType?: string
  area?: string
  startDate?: string
  endDate?: string
  gpa?: string
  details: string[]
}

type SkillCategory = {
  name: string
  keywords: string[]
}

type ProjectEntry = {
  name: string
  description?: string
  url?: string
  startDate?: string
  endDate?: string
  highlights: string[]
}

type CertificationEntry = {
  name: string
  issuer?: string
  date?: string
}

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
      
      if (data.content) {
        const content = data.content
        
        // Load basics
        if (content.basics) {
          setBasics({
            name: (content.basics as any).name || '',
            email: (content.basics as any).email || '',
            phone: (content.basics as any).phone || '',
            summary: (content.basics as any).summary || '',
            location: typeof (content.basics as any).location === 'string' 
              ? (content.basics as any).location 
              : (content.basics as any).location?.address || '',
            website: (content.basics as any).website || ''
          })
        } else if (content.person) {
          setBasics({
            name: (content.person as any).name || '',
            email: (content.person as any).email || '',
            phone: (content.person as any).phone || '',
            summary: (content as any).summary || '',
            location: (content.person as any).location || '',
            website: (content.person as any).links?.[0] || ''
          })
        }

        // Load work/experience
        if (content.work && Array.isArray(content.work)) {
          setWork(content.work.map((w: any) => ({
            name: w.name || '',
            position: w.position || '',
            location: w.location || '',
            startDate: w.startDate || '',
            endDate: w.endDate || '',
            summary: w.summary || '',
            highlights: Array.isArray(w.highlights) ? w.highlights : []
          })))
        } else if (content.experience && Array.isArray(content.experience)) {
          setWork(content.experience.map((exp: any) => ({
            name: exp.company || '',
            position: exp.title || '',
            location: exp.location || '',
            startDate: exp.start_date || '',
            endDate: exp.end_date || '',
            summary: '',
            highlights: Array.isArray(exp.bullets) ? exp.bullets : []
          })))
        }

        // Load education
        if (content.education && Array.isArray(content.education)) {
          setEducation(content.education.map((edu: any) => ({
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
            setSkills(content.skills.map((skill: any) => ({
              name: skill.name || '',
              keywords: Array.isArray(skill.keywords) ? skill.keywords : []
            })))
          } else if (typeof content.skills === 'object') {
            // Legacy format: skills as object with category keys
            setSkills(Object.entries(content.skills).map(([name, keywords]) => ({
              name,
              keywords: Array.isArray(keywords) ? keywords : []
            })))
          }
        }

        // Load projects
        if (content.projects && Array.isArray(content.projects)) {
          setProjects(content.projects.map((proj: any) => ({
            name: proj.name || '',
            description: proj.description || '',
            url: proj.url || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
            highlights: Array.isArray(proj.highlights) ? proj.highlights : []
          })))
        }

        // Load certifications
        if (content.certifications && Array.isArray(content.certifications)) {
          setCertifications(content.certifications.map((cert: any) => ({
            name: cert.name || '',
            issuer: cert.issuer || '',
            date: cert.date || ''
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
      const updatedContent: any = {}
      
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

      await resumeService.updateResume(id, {
        content: updatedContent
      })

      // Regenerate PDF and update history entry if it exists
      // IMPORTANT: Do this BEFORE loadResume to avoid state overwrite issues
      try {
        // Find associated history entry
        const historyItem = await getHistoryItemByResumeId(id)
        
        // Convert resume to PDF using the updatedContent we just saved
        const convertResult = await resumeService.convertResumeToPdf(
          updatedContent,
          historyItem?.file_name || resume.name
        )
        
        // Update history entry with new download URL if it exists
        if (historyItem) {
          const newDownloadUrl = convertResult.storage.public_url || convertResult.storage.url
          
          await updateHistoryItem(historyItem.id, {
            download_url: newDownloadUrl
          })
          
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
  }

  const updateWorkEntry = (index: number, field: keyof WorkEntry, value: any) => {
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
  }

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: any) => {
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
  }

  const updateSkillCategory = (index: number, field: keyof SkillCategory, value: any) => {
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
  }

  const updateProjectEntry = (index: number, field: keyof ProjectEntry, value: any) => {
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
  }

  const updateCertificationEntry = (index: number, field: keyof CertificationEntry, value: string) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const removeCertificationEntry = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
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
          <Button onClick={() => navigate('/resumes')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resumes
          </Button>
          <Button onClick={() => navigate('/tailor')}>
            <Plus className="mr-2 h-4 w-4" /> Create New Resume
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/resumes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Edit Resume</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {resume.name} • Last updated: {new Date(resume.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basics Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
          </div>
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
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="summary">Professional Summary</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAIEdit('basics_summary', 'Professional Summary', basics.summary)}
                  className="h-8 px-2"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Edit
                </Button>
              </div>
              <Textarea
                id="summary"
                rows={4}
                value={basics.summary}
                onChange={(e) => setBasics({ ...basics, summary: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Experience</h2>
            </div>
            <Button variant="outline" size="sm" onClick={addWorkEntry}>
              <Plus className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          </div>
          {work.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No experience entries yet. Click "Add Experience" to get started.</p>
          ) : (
            <div className="space-y-6">
              {work.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
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
                        value={entry.startDate || ''}
                        onChange={(e) => updateWorkEntry(index, 'startDate', e.target.value)}
                        placeholder="YYYY-MM or YYYY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        value={entry.endDate || ''}
                        onChange={(e) => updateWorkEntry(index, 'endDate', e.target.value)}
                        placeholder="YYYY-MM, YYYY, or Present"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Summary</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('work_summary', `Work Summary - ${entry.name}`, entry.summary || '', index)}
                          className="h-8 px-2"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Edit
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('work_highlight', `Work Highlight - ${entry.name}`, highlight, index, hIndex)}
                          className="h-8 px-2"
                          title="AI Edit"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
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
        </section>

        {/* Education Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Education</h2>
            </div>
            <Button variant="outline" size="sm" onClick={addEducationEntry}>
              <Plus className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </div>
          {education.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No education entries yet. Click "Add Education" to get started.</p>
          ) : (
            <div className="space-y-6">
              {education.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
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
                        value={entry.startDate || ''}
                        onChange={(e) => updateEducationEntry(index, 'startDate', e.target.value)}
                        placeholder="YYYY-MM or YYYY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        value={entry.endDate || ''}
                        onChange={(e) => updateEducationEntry(index, 'endDate', e.target.value)}
                        placeholder="YYYY-MM or YYYY"
                      />
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('education_detail', `Education Detail - ${entry.institution}`, detail, undefined, undefined, index, dIndex)}
                          className="h-8 px-2"
                          title="AI Edit"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
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
        </section>

        {/* Skills Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Skills</h2>
            </div>
            <Button variant="outline" size="sm" onClick={addSkillCategory}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No skill categories yet. Click "Add Category" to get started.</p>
          ) : (
            <div className="space-y-6">
              {skills.map((category, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
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
        </section>

        {/* Projects Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Projects</h2>
            </div>
            <Button variant="outline" size="sm" onClick={addProjectEntry}>
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No projects yet. Click "Add Project" to get started.</p>
          ) : (
            <div className="space-y-6">
              {projects.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
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
                        value={entry.startDate || ''}
                        onChange={(e) => updateProjectEntry(index, 'startDate', e.target.value)}
                        placeholder="YYYY-MM or YYYY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        value={entry.endDate || ''}
                        onChange={(e) => updateProjectEntry(index, 'endDate', e.target.value)}
                        placeholder="YYYY-MM, YYYY, or Present"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>Description</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('project_description', `Project Description - ${entry.name}`, entry.description || '', undefined, undefined, undefined, undefined, index)}
                          className="h-8 px-2"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          AI Edit
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIEdit('project_highlight', `Project Highlight - ${entry.name}`, highlight, undefined, hIndex, undefined, undefined, index)}
                          className="h-8 px-2"
                          title="AI Edit"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
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
        </section>

        {/* Certifications Section */}
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Certifications</h2>
            </div>
            <Button variant="outline" size="sm" onClick={addCertificationEntry}>
              <Plus className="mr-2 h-4 w-4" /> Add Certification
            </Button>
          </div>
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
                          value={entry.date || ''}
                          onChange={(e) => updateCertificationEntry(index, 'date', e.target.value)}
                          placeholder="YYYY-MM or YYYY"
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
    </div>
  )
}
