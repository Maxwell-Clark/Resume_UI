import { authenticatedFetch, handleApiResponse } from './auth'

export type StatusType = 'tailoring' | 'tailored' | 'applied' | 'interviewing' | 'rejected' | 'ghosted' | 'hired' | 'complete' | 'failed'

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
    }
  } catch (error) {
    console.error('Error saving history to Supabase:', error)
    throw error
  }
}

export async function getHistoryItems(): Promise<HistoryItem[]> {
  try {
    const response = await authenticatedFetch('/history?limit=50')
    
    const data = await handleApiResponse<HistoryItem[]>(response)
    return data.map((item: any) => ({
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      status_dates: item.status_dates || {},
      created_at: item.created_at,
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
    }
  } catch (error) {
    console.error('Error fetching history item:', error)
    return null
  }
}

export async function updateHistoryItem(
  id: string, 
  updates: Partial<Pick<HistoryItem, 'download_url' | 'status' | 'status_dates'>>
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
    }
  } catch (error) {
    console.error('Error updating history item:', error)
    throw error
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

const HISTORY_STORAGE_KEY = 'resume_tailoring_history'
