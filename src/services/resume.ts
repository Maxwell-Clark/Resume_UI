import { authenticatedFetch, handleApiResponse } from '@/lib/auth'

export interface Resume {
  id: string
  user_id: string
  name: string
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ResumeCreate {
  name: string
  content: Record<string, unknown>
}

export interface ResumeUpdate {
  name?: string
  content?: any
}

export const resumeService = {
  /**
   * Create a new resume
   */
  async createResume(data: ResumeCreate): Promise<Resume> {
    const response = await authenticatedFetch('/resumes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleApiResponse<Resume>(response)
  },

  /**
   * Get all resumes for the current user
   */
  async getResumes(limit: number = 50): Promise<Resume[]> {
    const response = await authenticatedFetch(`/resumes?limit=${limit}`)
    return handleApiResponse<Resume[]>(response)
  },

  /**
   * Get a specific resume by ID
   */
  async getResume(id: string): Promise<Resume> {
    const response = await authenticatedFetch(`/resumes/${id}`)
    return handleApiResponse<Resume>(response)
  },

  /**
   * Update a resume
   */
  async updateResume(id: string, data: ResumeUpdate): Promise<Resume> {
    const response = await authenticatedFetch(`/resumes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleApiResponse<Resume>(response)
  },

  /**
   * Delete a resume
   */
  async deleteResume(id: string): Promise<void> {
    const response = await authenticatedFetch(`/resumes/${id}`, {
      method: 'DELETE',
    })
    return handleApiResponse<void>(response)
  },
}

