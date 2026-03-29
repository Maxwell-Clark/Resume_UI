import { useState, useCallback } from 'react'
import { useArrayField, type ArrayFieldOps } from './useArrayField'
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
import type { ParsedResume, Resume } from '@/services/resume'

interface BasicsState {
  name: string
  label: string
  email: string
  phone: string
  summary: string
  location: string
  website: string
}

const DEFAULT_BASICS: BasicsState = {
  name: '',
  label: '',
  email: '',
  phone: '',
  summary: '',
  location: '',
  website: ''
}

export interface UseResumeContentReturn {
  basics: BasicsState
  setBasics: (basics: BasicsState) => void
  workOps: ArrayFieldOps<WorkEntry>
  educationOps: ArrayFieldOps<EducationEntry>
  skillsOps: ArrayFieldOps<SkillCategory>
  projectsOps: ArrayFieldOps<ProjectEntry>
  certificationOps: ArrayFieldOps<CertificationEntry>
  awardOps: ArrayFieldOps<AwardEntry>
  volunteerOps: ArrayFieldOps<VolunteerEntry>
  publicationOps: ArrayFieldOps<PublicationEntry>
  languageOps: ArrayFieldOps<LanguageEntry>
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  expandSection: (section: string) => void
  buildResumeContent: () => ParsedResume
  hydrateFromResume: (data: Resume) => void
}

export function useResumeContent(): UseResumeContentReturn {
  const [basics, setBasics] = useState<BasicsState>(DEFAULT_BASICS)

  // Accordion state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basics', 'work', 'education', 'skills'])
  )

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  const expandSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      if (prev.has(section)) return prev
      const newSet = new Set(prev)
      newSet.add(section)
      return newSet
    })
  }, [])

  // Array fields with expand-on-add
  const workOps = useArrayField<WorkEntry>([], () => expandSection('work'))
  const educationOps = useArrayField<EducationEntry>([], () => expandSection('education'))
  const skillsOps = useArrayField<SkillCategory>([], () => expandSection('skills'))
  const projectsOps = useArrayField<ProjectEntry>([], () => expandSection('projects'))
  const certificationOps = useArrayField<CertificationEntry>([], () => expandSection('certifications'))
  const awardOps = useArrayField<AwardEntry>([], () => expandSection('awards'))
  const volunteerOps = useArrayField<VolunteerEntry>([], () => expandSection('volunteer'))
  const publicationOps = useArrayField<PublicationEntry>([], () => expandSection('publications'))
  const languageOps = useArrayField<LanguageEntry>([], () => expandSection('languages'))

  const buildResumeContent = useCallback((): ParsedResume => {
    const content: ResumeContent = {}

    content.basics = {}
    content.basics.name = basics.name?.trim() || 'Resume'
    if (basics.label?.trim()) content.basics.label = basics.label.trim()
    if (basics.email?.trim()) content.basics.email = basics.email.trim()
    if (basics.phone?.trim()) content.basics.phone = basics.phone.trim()
    if (basics.location?.trim()) content.basics.location = basics.location.trim()
    if (basics.website?.trim()) content.basics.website = basics.website.trim()
    if (basics.summary?.trim()) content.basics.summary = basics.summary.trim()

    const validWork = workOps.items
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

    const validEducation = educationOps.items
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

    const validSkills = skillsOps.items
      .filter(s => s.name && s.keywords.length > 0)
      .map(s => ({
        name: s.name,
        keywords: s.keywords.filter(k => k.trim())
      }))
    if (validSkills.length > 0) content.skills = validSkills

    const validProjects = projectsOps.items
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

    const validCerts = certificationOps.items.filter(c => c.name)
    if (validCerts.length > 0) content.certificates = validCerts

    const validAwards = awardOps.items.filter(a => a.title)
    if (validAwards.length > 0) content.awards = validAwards

    const validVolunteer = volunteerOps.items
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

    const validPublications = publicationOps.items.filter(p => p.name)
    if (validPublications.length > 0) content.publications = validPublications

    const validLanguages = languageOps.items.filter(l => l.language)
    if (validLanguages.length > 0) content.languages = validLanguages

    content.person = content.basics
    content.experience = content.work || []

    return content as ParsedResume
  }, [basics, workOps.items, educationOps.items, skillsOps.items, projectsOps.items, certificationOps.items, awardOps.items, volunteerOps.items, publicationOps.items, languageOps.items])

  const hydrateFromResume = useCallback((data: Resume) => {
    if (!data.content) return
    const content = data.content as ResumeContent

    // Load basics
    if (content.basics) {
      const b = content.basics as Record<string, unknown>
      setBasics({
        name: (b.name as string) || '',
        label: (b.label as string) || '',
        email: (b.email as string) || '',
        phone: (b.phone as string) || '',
        summary: (b.summary as string) || '',
        location: typeof b.location === 'string'
          ? b.location
          : ((b.location as Record<string, unknown>)?.address as string) || '',
        website: (b.website as string) || ''
      })
    } else if (content.person) {
      const person = content.person as Record<string, unknown>
      setBasics({
        name: (person.name as string) || '',
        label: (person.label as string) || '',
        email: (person.email as string) || '',
        phone: (person.phone as string) || '',
        summary: ((content as Record<string, unknown>).summary as string) || '',
        location: (person.location as string) || '',
        website: ((person.links as string[])?.[0]) || ''
      })
    }

    // Load work/experience
    if (content.work && Array.isArray(content.work)) {
      workOps.setItems(content.work.map((w) => ({
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
      workOps.setItems(expData.map((exp) => ({
        name: (exp.company as string) || '',
        position: (exp.title as string) || '',
        location: (exp.location as string) || '',
        startDate: (exp.start_date as string) || '',
        endDate: (exp.end_date as string) || '',
        summary: '',
        highlights: Array.isArray(exp.bullets) ? exp.bullets as string[] : []
      })))
    }

    if (content.education && Array.isArray(content.education)) {
      educationOps.setItems(content.education.map((edu) => ({
        institution: edu.institution || '',
        studyType: edu.studyType || '',
        area: edu.area || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || '',
        details: Array.isArray(edu.details) ? edu.details : []
      })))
    }

    if (content.skills) {
      if (Array.isArray(content.skills)) {
        skillsOps.setItems(content.skills.map((skill) => ({
          name: skill.name || '',
          keywords: Array.isArray(skill.keywords) ? skill.keywords : []
        })))
      } else if (typeof content.skills === 'object') {
        const skillsObj = content.skills as Record<string, unknown>
        skillsOps.setItems(Object.entries(skillsObj).map(([name, keywords]) => ({
          name,
          keywords: Array.isArray(keywords) ? keywords as string[] : []
        })))
      }
    }

    if (content.projects && Array.isArray(content.projects)) {
      projectsOps.setItems(content.projects.map((proj) => ({
        name: proj.name || '',
        description: proj.description || '',
        url: proj.url || '',
        startDate: proj.startDate || '',
        endDate: proj.endDate || '',
        highlights: Array.isArray(proj.highlights) ? proj.highlights : []
      })))
    }

    const certs = content.certifications || content.certificates
    if (certs && Array.isArray(certs)) {
      certificationOps.setItems(certs.map((cert) => ({
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || ''
      })))
    }

    if (content.awards && Array.isArray(content.awards)) {
      awardOps.setItems(content.awards.map((award) => ({
        title: award.title || '',
        date: award.date || '',
        awarder: award.awarder || '',
        summary: award.summary || ''
      })))
    }

    if (content.volunteer && Array.isArray(content.volunteer)) {
      volunteerOps.setItems(content.volunteer.map((vol) => ({
        organization: vol.organization || '',
        position: vol.position || '',
        startDate: vol.startDate || '',
        endDate: vol.endDate || '',
        summary: vol.summary || '',
        highlights: Array.isArray(vol.highlights) ? vol.highlights : []
      })))
    }

    if (content.publications && Array.isArray(content.publications)) {
      publicationOps.setItems(content.publications.map((pub) => ({
        name: pub.name || '',
        publisher: pub.publisher || '',
        releaseDate: pub.releaseDate || '',
        url: pub.url || '',
        summary: pub.summary || ''
      })))
    }

    if (content.languages && Array.isArray(content.languages)) {
      languageOps.setItems(content.languages.map((lang) => ({
        language: lang.language || '',
        fluency: lang.fluency || ''
      })))
    }
  }, [workOps, educationOps, skillsOps, projectsOps, certificationOps, awardOps, volunteerOps, publicationOps, languageOps])

  return {
    basics,
    setBasics,
    workOps,
    educationOps,
    skillsOps,
    projectsOps,
    certificationOps,
    awardOps,
    volunteerOps,
    publicationOps,
    languageOps,
    expandedSections,
    toggleSection,
    expandSection,
    buildResumeContent,
    hydrateFromResume,
  }
}
