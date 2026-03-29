// Shared resume types for the application

export interface PersonInfo {
  name?: string
  label?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  summary?: string
}

export interface WorkEntry {
  name: string
  position: string
  location?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights: string[]
}

export interface EducationEntry {
  institution: string
  studyType?: string
  area?: string
  startDate?: string
  endDate?: string
  gpa?: string
  details: string[]
}

export interface SkillCategory {
  name: string
  keywords: string[]
}

export interface ProjectEntry {
  name: string
  description?: string
  url?: string
  startDate?: string
  endDate?: string
  highlights: string[]
}

export interface CertificationEntry {
  name: string
  issuer?: string
  date?: string
}

export interface AwardEntry {
  title: string
  date?: string
  awarder?: string
  summary?: string
}

export interface VolunteerEntry {
  organization: string
  position?: string
  startDate?: string
  endDate?: string
  summary?: string
  highlights: string[]
}

export interface PublicationEntry {
  name: string
  publisher?: string
  releaseDate?: string
  url?: string
  summary?: string
}

export interface LanguageEntry {
  language: string
  fluency?: string
}

export interface ResumeContent {
  basics?: PersonInfo
  person?: PersonInfo
  work?: WorkEntry[]
  experience?: WorkEntry[]
  education?: EducationEntry[]
  skills?: SkillCategory[]
  projects?: ProjectEntry[]
  certificates?: CertificationEntry[]
  certifications?: CertificationEntry[]
  awards?: AwardEntry[]
  volunteer?: VolunteerEntry[]
  publications?: PublicationEntry[]
  languages?: LanguageEntry[]
  interests?: unknown[]
  references?: unknown[]
  [key: string]: unknown
}
