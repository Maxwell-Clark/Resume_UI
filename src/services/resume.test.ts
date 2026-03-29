import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthenticatedFetch, mockHandleApiResponse } = vi.hoisted(() => ({
  mockAuthenticatedFetch: vi.fn(),
  mockHandleApiResponse: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authenticatedFetch: mockAuthenticatedFetch,
  handleApiResponse: mockHandleApiResponse,
}))

import { resumeService, generateRetailorPrompt } from './resume'
import type { EnhancedMatchResponse, GapItem } from './resume'

describe('resumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createResume', () => {
    it('sends POST with JSON body and returns response', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      const resume = { id: '1', name: 'Test', content: {}, user_id: 'u1', created_at: '', updated_at: '' }
      mockHandleApiResponse.mockResolvedValue(resume)

      const data = { name: 'Test', content: { basics: {} } }
      const result = await resumeService.createResume(data)

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      expect(mockHandleApiResponse).toHaveBeenCalledWith(mockResponse)
      expect(result).toEqual(resume)
    })
  })

  describe('getResumes', () => {
    it('sends GET with default limit', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue([])

      await resumeService.getResumes()

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes?limit=50')
    })

    it('sends GET with custom limit', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue([])

      await resumeService.getResumes(10)

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes?limit=10')
    })
  })

  describe('getResume', () => {
    it('sends GET with resume ID in URL', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ id: 'abc' })

      await resumeService.getResume('abc')

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes/abc')
    })
  })

  describe('updateResume', () => {
    it('sends PATCH with ID and update data', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ id: 'abc', name: 'Updated' })

      const updates = { name: 'Updated' }
      await resumeService.updateResume('abc', updates)

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes/abc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    })
  })

  describe('deleteResume', () => {
    it('sends DELETE with resume ID', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue(undefined)

      await resumeService.deleteResume('abc')

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/resumes/abc', {
        method: 'DELETE',
      })
    })
  })

  describe('editText', () => {
    it('sends POST with text and instruction, returns edited_text', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ edited_text: 'improved text' })

      const result = await resumeService.editText('original text', 'make it better')

      expect(mockAuthenticatedFetch).toHaveBeenCalledWith('/edit-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'original text', instruction: 'make it better' }),
      })
      expect(result).toBe('improved text')
    })
  })

  describe('parseJobDescription', () => {
    it('sends FormData with text when not a URL', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ title: 'Engineer', company: 'Co', description: '', requirements: [] })

      await resumeService.parseJobDescription('Some job description', false)

      const [url, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(url).toBe('/parse/job')
      expect(options.method).toBe('POST')
      expect(options.body).toBeInstanceOf(FormData)
      expect(options.body.get('text')).toBe('Some job description')
      expect(options.body.get('url')).toBeNull()
    })

    it('sends FormData with url when isUrl is true', async () => {
      const mockResponse = {} as Response
      mockAuthenticatedFetch.mockResolvedValue(mockResponse)
      mockHandleApiResponse.mockResolvedValue({ title: 'Engineer', company: 'Co', description: '', requirements: [] })

      await resumeService.parseJobDescription('https://example.com/job', true)

      const [, options] = mockAuthenticatedFetch.mock.calls[0]
      expect(options.body.get('url')).toBe('https://example.com/job')
      expect(options.body.get('text')).toBeNull()
    })

    it('returns job_json when present in response', async () => {
      const jobData = { title: 'Dev', company: 'Acme', description: 'desc', requirements: ['JS'] }
      mockAuthenticatedFetch.mockResolvedValue({} as Response)
      mockHandleApiResponse.mockResolvedValue({ job_json: jobData })

      const result = await resumeService.parseJobDescription('text', false)
      expect(result).toEqual(jobData)
    })
  })
})

describe('generateRetailorPrompt', () => {
  it('includes match percentage in output', () => {
    const matchResult: EnhancedMatchResponse = {
      match_percentage: 65,
      score_breakdown: {
        overall: 65,
        skills_match: 70,
        experience_match: 60,
        education_match: 80,
        ats_compatibility: 50,
        ai_role_fit: 65,
      },
      strengths: [],
      gaps: [],
      recommendations: ['Add Python to skills'],
    }

    const prompt = generateRetailorPrompt(matchResult)
    expect(prompt).toContain('Current match score: 65%')
  })

  it('includes recommendation actions', () => {
    const matchResult: EnhancedMatchResponse = {
      match_percentage: 50,
      score_breakdown: { overall: 50, skills_match: 50, experience_match: 50, education_match: 50, ats_compatibility: 50, ai_role_fit: 50 },
      strengths: [],
      gaps: [],
      recommendations: ['Add React experience', 'Emphasize leadership'],
    }

    const prompt = generateRetailorPrompt(matchResult)
    expect(prompt).toContain('ACTION 1: Add React experience')
    expect(prompt).toContain('ACTION 2: Emphasize leadership')
  })

  it('includes gaps sorted by severity', () => {
    const gaps: GapItem[] = [
      { description: 'Nice gap', severity: 'nice_to_have', category: 'skills', recommendation: 'Optional fix' },
      { description: 'Critical gap', severity: 'critical', category: 'experience', recommendation: 'Must fix' },
      { description: 'Important gap', severity: 'important', category: 'education', recommendation: 'Should fix' },
    ]

    const matchResult: EnhancedMatchResponse = {
      match_percentage: 40,
      score_breakdown: { overall: 40, skills_match: 30, experience_match: 40, education_match: 50, ats_compatibility: 40, ai_role_fit: 40 },
      strengths: [],
      gaps,
      recommendations: [],
    }

    const prompt = generateRetailorPrompt(matchResult)
    expect(prompt).toContain('CRITICAL GAPS')
    expect(prompt).toContain('Critical gap')
    expect(prompt).toContain('IMPORTANT GAPS')
    expect(prompt).toContain('Important gap')
    expect(prompt).toContain('NICE TO HAVE')
    expect(prompt).toContain('Nice gap')
    // Critical count warning
    expect(prompt).toContain('1 CRITICAL gap(s)')
  })

  it('shows no gaps message when gaps array is empty', () => {
    const matchResult: EnhancedMatchResponse = {
      match_percentage: 95,
      score_breakdown: { overall: 95, skills_match: 95, experience_match: 95, education_match: 95, ats_compatibility: 95, ai_role_fit: 95 },
      strengths: [],
      gaps: [],
      recommendations: [],
    }

    const prompt = generateRetailorPrompt(matchResult)
    expect(prompt).toContain('No gaps to address.')
  })
})
