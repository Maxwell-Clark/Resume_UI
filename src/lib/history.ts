const API_BASE_URL = 'http://0.0.0.0:8000'

export interface HistoryItem {
  id: string
  file_name: string
  job_title: string
  company: string
  download_url: string
  original_resume_name?: string
  created_at: string
}

export async function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'created_at'>): Promise<void> {
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
        download_url: item.download_url,
        original_resume_name: item.original_resume_name || null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('History API error response:', errorText)
      throw new Error(`Failed to save history: ${response.status} ${response.statusText} - ${errorText}`)
    }
  } catch (error) {
    console.error('Error saving history to Supabase:', error)
    // Fallback to localStorage if API fails
    const history = getHistoryItemsFromLocalStorage()
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    history.unshift(newItem)
    const limitedHistory = history.slice(0, 50)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory))
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
      filename: item.filename,
      job_title: item.job_title,
      company: item.company,
      download_url: item.download_url,
      original_resume_name: item.original_resume_name,
      created_at: item.created_at,
    }))
  } catch (error) {
    console.error('Error fetching history from Supabase:', error)
    // Fallback to localStorage if API fails
    return getHistoryItemsFromLocalStorage()
  }
}

function getHistoryItemsFromLocalStorage(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading history from localStorage:', error)
    return []
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

const HISTORY_STORAGE_KEY = 'resume_tailoring_history'
