import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthenticatedFetch, mockHandleApiResponse } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn(),
  mockHandleApiResponse: vi.fn(),
}))

vi.mock('./auth', () => ({
  authenticatedFetch: mockAuthenticatedFetch,
  handleApiResponse: mockHandleApiResponse,
}))

import {
  hasEnhancedMatchData,
  getCriticalGapsCount,
  saveHistoryItem,
  getHistoryItems,
  getHistoryItemById,
  updateHistoryItem,
  deleteHistoryItem,
  saveHistoryCache,
  loadHistoryCache,
  clearHistory,
} from './history'
import type { MatchResults, HistoryItem } from './history'

const makeHistoryItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
  id: '1',
  file_name: 'resume.pdf',
  job_title: 'Engineer',
  company: 'Acme',
  status: 'tailored',
  created_at: '2025-01-01T00:00:00Z',
  favorited: false,
  ...overrides,
})

describe('hasEnhancedMatchData', () => {
  it('returns false for null/undefined', () => {
    expect(hasEnhancedMatchData(null)).toBe(false)
    expect(hasEnhancedMatchData(undefined)).toBe(false)
  })

  it('returns false when no enhanced fields present', () => {
    const results: MatchResults = {
      match_percentage: 80,
      strengths: ['Good'],
      gaps: ['Bad'],
      recommendations: ['Do this'],
      matched_at: '2025-01-01',
    }
    expect(hasEnhancedMatchData(results)).toBe(false)
  })

  it('returns true when score_breakdown is present', () => {
    const results: MatchResults = {
      match_percentage: 80,
      strengths: [],
      gaps: [],
      recommendations: [],
      matched_at: '2025-01-01',
      score_breakdown: { overall: 80, skills_match: 70, experience_match: 80, education_match: 90, ats_compatibility: 75, ai_role_fit: 80 },
    }
    expect(hasEnhancedMatchData(results)).toBe(true)
  })

  it('returns true when strengths_detailed is present', () => {
    const results: MatchResults = {
      match_percentage: 80,
      strengths: [],
      gaps: [],
      recommendations: [],
      matched_at: '2025-01-01',
      strengths_detailed: [{ description: 'Strong JS', confidence: 90, evidence: ['5 years'], category: 'skills' }],
    }
    expect(hasEnhancedMatchData(results)).toBe(true)
  })

  it('returns true when gaps_detailed is present', () => {
    const results: MatchResults = {
      match_percentage: 80,
      strengths: [],
      gaps: [],
      recommendations: [],
      matched_at: '2025-01-01',
      gaps_detailed: [{ description: 'No Python', severity: 'critical', category: 'skills', recommendation: 'Add Python' }],
    }
    expect(hasEnhancedMatchData(results)).toBe(true)
  })
})

describe('getCriticalGapsCount', () => {
  it('returns 0 for null/undefined', () => {
    expect(getCriticalGapsCount(null)).toBe(0)
    expect(getCriticalGapsCount(undefined)).toBe(0)
  })

  it('returns 0 when no gaps_detailed', () => {
    const results: MatchResults = {
      match_percentage: 80,
      strengths: [],
      gaps: [],
      recommendations: [],
      matched_at: '2025-01-01',
    }
    expect(getCriticalGapsCount(results)).toBe(0)
  })

  it('counts only critical gaps', () => {
    const results: MatchResults = {
      match_percentage: 50,
      strengths: [],
      gaps: [],
      recommendations: [],
      matched_at: '2025-01-01',
      gaps_detailed: [
        { description: 'Critical one', severity: 'critical', category: 'skills', recommendation: '' },
        { description: 'Important one', severity: 'important', category: 'skills', recommendation: '' },
        { description: 'Critical two', severity: 'critical', category: 'experience', recommendation: '' },
        { description: 'Nice one', severity: 'nice_to_have', category: 'education', recommendation: '' },
      ],
    }
    expect(getCriticalGapsCount(results)).toBe(2)
  })
})

describe('saveHistoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends POST to /history with correct body', async () => {
    const mockResponse = {} as Response
    mockAuthenticatedFetch.mockResolvedValue(mockResponse)
    const returnedItem = makeHistoryItem({ id: '42' })
    mockHandleApiResponse.mockResolvedValue(returnedItem)

    const input = {
      file_name: 'resume.pdf',
      job_title: 'Engineer',
      company: 'Acme',
      status: 'tailored' as const,
      favorited: false,
    }

    const result = await saveHistoryItem(input)

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
    const body = JSON.parse(mockAuthenticatedFetch.mock.calls[0][1].body)
    expect(body.file_name).toBe('resume.pdf')
    expect(body.job_title).toBe('Engineer')
    expect(body.company).toBe('Acme')
    expect(result.id).toBe('42')
  })
})

describe('getHistoryItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends GET with default limit and offset', async () => {
    mockAuthenticatedFetch.mockResolvedValue({} as Response)
    mockHandleApiResponse.mockResolvedValue([])

    await getHistoryItems()

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history?limit=50&offset=0')
  })

  it('sends GET with custom limit and offset', async () => {
    mockAuthenticatedFetch.mockResolvedValue({} as Response)
    mockHandleApiResponse.mockResolvedValue([])

    await getHistoryItems(10, 25)

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history?limit=25&offset=10')
  })

  it('returns empty array on error', async () => {
    mockAuthenticatedFetch.mockRejectedValue(new Error('Network error'))

    const result = await getHistoryItems()
    expect(result).toEqual([])
  })
})

describe('getHistoryItemById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends GET with ID and returns item', async () => {
    const item = makeHistoryItem({ id: '99' })
    mockAuthenticatedFetch.mockResolvedValue({ status: 200 } as Response)
    mockHandleApiResponse.mockResolvedValue(item)

    const result = await getHistoryItemById('99')

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history/99')
    expect(result?.id).toBe('99')
  })

  it('returns null on 404', async () => {
    mockAuthenticatedFetch.mockResolvedValue({ status: 404 } as Response)

    const result = await getHistoryItemById('missing')
    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    mockAuthenticatedFetch.mockRejectedValue(new Error('fail'))

    const result = await getHistoryItemById('bad')
    expect(result).toBeNull()
  })
})

describe('updateHistoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends PATCH with updates', async () => {
    const updated = makeHistoryItem({ id: '5', status: 'applied' })
    mockAuthenticatedFetch.mockResolvedValue({} as Response)
    mockHandleApiResponse.mockResolvedValue(updated)

    const result = await updateHistoryItem('5', { status: 'applied' })

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history/5', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'applied' }),
    })
    expect(result.status).toBe('applied')
  })
})

describe('deleteHistoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends DELETE with ID', async () => {
    mockAuthenticatedFetch.mockResolvedValue({ ok: true } as Response)

    await deleteHistoryItem('10')

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/history/10', {
      method: 'DELETE',
    })
  })

  it('throws on failed delete', async () => {
    mockAuthenticatedFetch.mockResolvedValue({ ok: false } as Response)

    await expect(deleteHistoryItem('10')).rejects.toThrow('Failed to delete history item')
  })
})

describe('saveHistoryCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('saves Map to localStorage as JSON object', () => {
    const items = [makeHistoryItem({ id: '1' })]
    const map = new Map<string, typeof items>()
    map.set('0-50', items)

    saveHistoryCache(map)

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'resume_history_cache',
      expect.any(String),
    )
    const stored = JSON.parse((localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1])
    expect(stored['0-50']).toHaveLength(1)
    expect(stored['0-50'][0].id).toBe('1')
  })
})

describe('loadHistoryCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns null when no cache exists', () => {
    const result = loadHistoryCache()
    expect(result).toBeNull()
  })

  it('returns Map from valid cached data', () => {
    const cacheData = { '0-50': [makeHistoryItem({ id: '1' })] }
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(cacheData))

    const result = loadHistoryCache()

    expect(result).toBeInstanceOf(Map)
    expect(result?.get('0-50')).toHaveLength(1)
  })

  it('returns null on invalid JSON', () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('not valid json{{{')

    const result = loadHistoryCache()
    expect(result).toBeNull()
  })
})

describe('clearHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes history from localStorage', () => {
    clearHistory()
    expect(localStorage.removeItem).toHaveBeenCalledWith('resume_tailoring_history')
  })
})
