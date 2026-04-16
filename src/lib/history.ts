import { authenticatedFetch, handleApiResponse } from './auth'
import type {
  MatchScoreBreakdown,
  ExperienceAnalysisResponse,
  EducationAnalysisResponse,
  StrengthItem,
  GapItem,
} from '@/services/resume'

export type StatusType = 'tailoring' | 'tailored' | 'applied' | 'interviewing' | 'rejected' | 'ghosted' | 'hired' | 'complete' | 'failed'
export type WorkLocationType = 'remote' | 'hybrid' | 'onsite' | 'flexible'
export type PriorityType = 'low' | 'medium' | 'high'

export interface MatchResults {
  match_percentage: number
  // Legacy string arrays for backward compatibility
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  matched_at: string
  // Enhanced analysis fields (optional for backward compatibility)
  score_breakdown?: MatchScoreBreakdown
  experience_analysis?: ExperienceAnalysisResponse
  education_analysis?: EducationAnalysisResponse
  strengths_detailed?: StrengthItem[]
  gaps_detailed?: GapItem[]
}

/**
 * Check if match results have enhanced data
 */
export function hasEnhancedMatchData(results: MatchResults | null | undefined): boolean {
  return !!(results?.score_breakdown || results?.strengths_detailed || results?.gaps_detailed)
}

/**
 * Get the count of critical gaps from enhanced match results
 */
export function getCriticalGapsCount(results: MatchResults | null | undefined): number {
  if (!results?.gaps_detailed) return 0
  return results.gaps_detailed.filter(g => g.severity === 'critical').length
}

export interface JobData {
  title: string
  company: string
  description: string
  requirements: string[]
  [key: string]: unknown
}

export interface HistoryItem {
  id: string
  file_name: string
  job_title: string
  company: string
  download_url?: string
  original_resume_name?: string
  status: StatusType
  status_dates?: Partial<Record<StatusType, string>>
  created_at: string
  resume_id?: string
  favorited: boolean
  salary_range?: string
  industry?: string
  match_results?: MatchResults
  job_json?: JobData
  // Enhanced job details
  job_posting_url?: string
  location?: string
  work_location_type?: WorkLocationType
  application_deadline?: string
  notes?: string
  contact_person?: string
  contact_email?: string
  source?: string
  priority?: PriorityType
  page_count?: number
}

export async function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'created_at'>): Promise<HistoryItem> {
  try {
    const response = await authenticatedFetch('/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: item.file_name,
        job_title: item.job_title,
        company: item.company,
        download_url: item.download_url || null,
        original_resume_name: item.original_resume_name || null,
        status: item.status || 'tailoring',
        resume_id: item.resume_id || null,
        favorited: item.favorited || false,
        salary_range: item.salary_range || null,
        industry: item.industry || null,
        match_results: item.match_results || null,
        job_json: item.job_json || null,
        // Enhanced job details
        job_posting_url: item.job_posting_url || null,
        location: item.location || null,
        work_location_type: item.work_location_type || null,
        application_deadline: item.application_deadline || null,
        notes: item.notes || null,
        contact_person: item.contact_person || null,
        contact_email: item.contact_email || null,
        source: item.source || null,
        priority: item.priority || null,
      }),
    })

    const data = await handleApiResponse<HistoryItem>(response)
    return {
      id: data.id.toString(),
      file_name: data.file_name,
      job_title: data.job_title,
      company: data.company,
      download_url: data.download_url,
      original_resume_name: data.original_resume_name,
      status: data.status || 'tailoring',
      status_dates: data.status_dates || {},
      created_at: data.created_at,
      resume_id: data.resume_id,
      favorited: data.favorited || false,
      salary_range: data.salary_range,
      industry: data.industry,
      match_results: data.match_results,
      job_json: data.job_json,
      job_posting_url: data.job_posting_url,
      location: data.location,
      work_location_type: data.work_location_type,
      application_deadline: data.application_deadline,
      notes: data.notes,
      contact_person: data.contact_person,
      contact_email: data.contact_email,
      source: data.source,
      priority: data.priority,
      page_count: data.page_count,
    }
  } catch (error) {
    console.error('Error saving history to Supabase:', error)
    throw error
  }
}

export async function getHistoryItems(offset: number = 0, limit: number = 50): Promise<HistoryItem[]> {
  try {
    const response = await authenticatedFetch(`/history?limit=${limit}&offset=${offset}`)

    const data = await handleApiResponse<HistoryItem[]>(response)
    return data.map((item: HistoryItem) => ({
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      status_dates: item.status_dates || {},
      created_at: item.created_at,
      resume_id: item.resume_id,
      favorited: item.favorited || false,
      match_results: item.match_results,
      job_json: item.job_json,
      salary_range: item.salary_range,
      industry: item.industry,
      job_posting_url: item.job_posting_url,
      location: item.location,
      work_location_type: item.work_location_type,
      application_deadline: item.application_deadline,
      notes: item.notes,
      contact_person: item.contact_person,
      contact_email: item.contact_email,
      source: item.source,
      priority: item.priority,
      page_count: item.page_count,
    }))
  } catch (error) {
    console.error('Error fetching history from Supabase:', error)
    return []
  }
}

export async function getHistoryItemById(id: string): Promise<HistoryItem | null> {
  try {
    const response = await authenticatedFetch(`/history/${id}`)

    if (response.status === 404) return null

    const item = await handleApiResponse<HistoryItem>(response)
    return {
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      status_dates: item.status_dates || {},
      created_at: item.created_at,
      resume_id: item.resume_id,
      favorited: item.favorited || false,
      match_results: item.match_results,
      job_json: item.job_json,
      salary_range: item.salary_range,
      industry: item.industry,
      job_posting_url: item.job_posting_url,
      location: item.location,
      work_location_type: item.work_location_type,
      application_deadline: item.application_deadline,
      notes: item.notes,
      contact_person: item.contact_person,
      contact_email: item.contact_email,
      source: item.source,
      priority: item.priority,
      page_count: item.page_count,
    }
  } catch (error) {
    console.error('Error fetching history item:', error)
    return null
  }
}

export async function getHistoryItemByResumeId(resume_id: string): Promise<HistoryItem | null> {
  try {
    const response = await authenticatedFetch(`/history/resume/${resume_id}`)

    if (response.status === 404) return null

    const item = await handleApiResponse<HistoryItem>(response)
    return {
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      status_dates: item.status_dates || {},
      created_at: item.created_at,
      resume_id: item.resume_id,
      favorited: item.favorited || false,
      match_results: item.match_results,
      job_json: item.job_json,
      salary_range: item.salary_range,
      industry: item.industry,
      job_posting_url: item.job_posting_url,
      location: item.location,
      work_location_type: item.work_location_type,
      application_deadline: item.application_deadline,
      notes: item.notes,
      contact_person: item.contact_person,
      contact_email: item.contact_email,
      source: item.source,
      priority: item.priority,
      page_count: item.page_count,
    }
  } catch (error) {
    console.error('Error fetching history item by resume_id:', error)
    return null
  }
}

export async function updateHistoryItem(
  id: string,
  updates: Partial<Pick<HistoryItem, 'download_url' | 'status' | 'status_dates' | 'file_name' | 'favorited' | 'company' | 'job_title' | 'match_results' | 'job_json' | 'salary_range' | 'industry' | 'job_posting_url' | 'location' | 'work_location_type' | 'application_deadline' | 'notes' | 'contact_person' | 'contact_email' | 'source' | 'priority'>>
): Promise<HistoryItem> {
  try {
    const response = await authenticatedFetch(`/history/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const item = await handleApiResponse<HistoryItem>(response)
    return {
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      status_dates: item.status_dates || {},
      created_at: item.created_at,
      resume_id: item.resume_id,
      favorited: item.favorited || false,
      match_results: item.match_results,
      job_json: item.job_json,
      salary_range: item.salary_range,
      industry: item.industry,
      job_posting_url: item.job_posting_url,
      location: item.location,
      work_location_type: item.work_location_type,
      application_deadline: item.application_deadline,
      notes: item.notes,
      contact_person: item.contact_person,
      contact_email: item.contact_email,
      source: item.source,
      priority: item.priority,
      page_count: item.page_count,
    }
  } catch (error) {
    console.error('Error updating history item:', error)
    throw error
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const response = await authenticatedFetch(`/history/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete history item')
    }
  } catch (error) {
    console.error('Error deleting history item:', error)
    throw error
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

const HISTORY_STORAGE_KEY = 'resume_tailoring_history'
const HISTORY_CACHE_KEY = 'resume_history_cache'

/**
 * Save cached history ranges to localStorage
 */
export function saveHistoryCache(cachedRanges: Map<string, HistoryItem[]>): void {
  try {
    // Convert Map to plain object for localStorage
    const cacheObject: Record<string, HistoryItem[]> = {}
    cachedRanges.forEach((items, key) => {
      cacheObject[key] = items
    })
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(cacheObject))
  } catch (error) {
    console.error('Error saving history cache to localStorage:', error)
  }
}

/**
 * Load cached history ranges from localStorage
 */
export function loadHistoryCache(): Map<string, HistoryItem[]> | null {
  try {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY)
    if (!cached) return null

    const cacheObject: Record<string, HistoryItem[]> = JSON.parse(cached)
    const map = new Map<string, HistoryItem[]>()

    Object.entries(cacheObject).forEach(([key, items]) => {
      map.set(key, items)
    })

    return map
  } catch (error) {
    console.error('Error loading history cache from localStorage:', error)
    return null
  }
}
