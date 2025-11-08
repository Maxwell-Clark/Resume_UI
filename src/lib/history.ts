const API_BASE_URL = 'http://0.0.0.0:8000'

export interface HistoryItem {
  id: string
  file_name: string
  job_title: string
  company: string
  download_url?: string
  original_resume_name?: string
  status: 'tailoring' | 'complete' | 'failed'
  created_at: string
}

export async function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'created_at'>): Promise<HistoryItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('History API error response:', errorText)
      throw new Error(`Failed to save history: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return {
      id: data.id.toString(),
      file_name: data.file_name,
      job_title: data.job_title,
      company: data.company,
      download_url: data.download_url,
      original_resume_name: data.original_resume_name,
      status: data.status || 'tailoring',
      created_at: data.created_at,
    }
  } catch (error) {
    console.error('Error saving history to Supabase:', error)
    throw error
  }
}

export async function getHistoryItems(): Promise<HistoryItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history?limit=50`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`)
    }

    const data = await response.json()
    return data.map((item: any) => ({
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      created_at: item.created_at,
    }))
  } catch (error) {
    console.error('Error fetching history from Supabase:', error)
    return []
  }
}

export async function getHistoryItemById(id: string): Promise<HistoryItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch history: ${response.statusText}`)
    }

    const item = await response.json()
    return {
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
      created_at: item.created_at,
    }
  } catch (error) {
    console.error('Error fetching history item:', error)
    return null
  }
}

export async function updateHistoryItem(id: string, updates: Partial<Pick<HistoryItem, 'download_url' | 'status'>>): Promise<HistoryItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Failed to update history: ${response.statusText}`)
    }

    const item = await response.json()
    return {
      id: item.id.toString(),
      file_name: item.file_name,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      status: item.status || 'tailoring',
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
