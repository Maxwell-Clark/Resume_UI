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

export interface ParsedResume {
  person: any
  experience: any[]
  education: any[]
  skills: any[]
  [key: string]: any
}

export interface JobData {
  title: string
  company: string
  description: string
  requirements: string[]
  [key: string]: any
}

export interface MatchResponse {
  match_percentage: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

export interface StorageInfo {
  url?: string
  signed_url?: string
  public_url?: string
  path: string
  bucket: string
}

export interface TailorResponse {
  storage: StorageInfo
  format: string
  note?: string
}

export const DEFAULT_TAILOR_PROMPT = `Tailor the resume to achieve maximum alignment with the job description. Return ONLY a single valid JSON object matching the JSON Resume schema. Do NOT include Markdown, code fences, LaTeX, or any text outside the JSON.

STRATEGIC ANALYSIS:
- Extract the top 10 job-critical terms from the JD (skills, tools, methods, responsibilities, outcomes).
- Build an internal TRANSFERABILITY MAP that pairs each JD term to the closest evidence in the resume using this ladder:
  TIER 1: Exact match (same tool/method appears in resume).
  TIER 2: Synonym/near-equivalent supported by resume (e.g., 'financial modeling' ↔ 'forecasting/variance models in Excel').
  TIER 3: Parent/neutral concept supported by resume (e.g., 'valuation' ↔ 'financial analysis'; 'DevOps' ↔ 'automation/monitoring').
- Use only terms that can be justified by TIER 1–3 evidence. If no evidence exists, omit the JD term.

TRUTH & SCOPE GUARDRAILS:
- Preserve employers, titles, dates, locations, and metrics exactly. Do not add new employers/titles/dates.
- Do not add tools, certifications, or frameworks that are not in the resume. Use broader parent terms instead (TIER 3) when needed.
- You may rewrite text fields only: summary, work[].highlights, projects[].highlights, and reorder skills[].keywords.
- If a section/field is missing in the input, leave it missing.

BULLET STYLE (ATS):
- One sentence each, 10–22 words, start with a strong verb, end with a period, plain ASCII.
- Present tense for current role; past tense for previous roles.
- Include 1–2 JD-aligned terms per bullet from the TRANSFERABILITY MAP (avoid stuffing).
- Keep numbers/units exactly as in the resume; never invent metrics.
- Remove filler and duplicates; prefer outcomes, scale, ownership, quality, compliance, or speed.

WHAT TO SURFACE (DOMAIN-AGNOSTIC):
- Ownership and scope (end-to-end delivery, accountability, deadlines, stakeholders).
- Scale/throughput/volume (transactions, clients, reports, patients, campaigns, etc.).
- Methods/tools the JD cares about (only if present; otherwise use parent terms: analysis, automation, reporting, controls, documentation, testing, compliance).
- Cross-functional collaboration (finance, ops, product, legal, clinicians, sales, etc.).
- Performance/quality improvements (latency, accuracy, error rate, audit readiness, customer satisfaction, on-time delivery).

SKILLS SECTION:
- Reorder to place JD-relevant skills first. Group logically (Languages/Tools/Methods/Platforms).
- Ensure any tool/method mentioned in bullets appears in skills[].keywords. Do not add skills not in the resume; use parent terms instead.
- Remove stray sentences; keep skills as nouns/phrases only.

HYGIENE:
- Move location strings (e.g., 'Remote – City, ST') into the location field, not bullets.
- Ensure each work entry has 2–6 bullets (rewrite/merge existing content to reach at least 2 without invention).
- Preserve section order and all non-text fields.

SELF-CHECK BEFORE OUTPUT (internal only):
- Validate JSON against schema. No extra text outside JSON.
- Verify every bullet follows length/tense/period rules and uses only TIER 1–3 mapped terms.
- Confirm no new tools/titles/dates/certs were introduced.`

/**
 * Generate a retailor prompt enhanced with match analysis results
 */
export function generateRetailorPrompt(matchResult: MatchResponse): string {
  const gapsText = matchResult.gaps.length > 0
    ? `\n- The following gaps were identified:\n${matchResult.gaps.map(gap => `  • ${gap}`).join('\n')}`
    : '\n- No significant gaps were identified.'

  const recommendationsText = matchResult.recommendations.length > 0
    ? `\n- Recommended improvements:\n${matchResult.recommendations.map((rec, idx) => `  ${idx + 1}. ${rec}`).join('\n')}`
    : '\n- No specific recommendations provided.'

  return `${DEFAULT_TAILOR_PROMPT}

MATCH ANALYSIS RESULTS:
The resume was analyzed against the job description and achieved a ${matchResult.match_percentage}% match score.${gapsText}${recommendationsText}

PRIORITY FOCUS:
- Address the identified gaps by incorporating relevant skills, experiences, or achievements that align with the job requirements.
- Prioritize improvements that will increase the match score while maintaining truth and accuracy.
- Emphasize the recommended improvements in the resume tailoring process.
- Focus on bridging the gap between current resume content and job requirements through strategic rewording and emphasis.`
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

  /**
   * Convert resume content to PDF
   */
  async convertResumeToPdf(content: Record<string, unknown>, filename?: string): Promise<{ storage: { public_url: string; url: string; signed_url?: string }; format: string }> {
    const params = new URLSearchParams({
      format: 'pdf',
      store: 'true',
      bucket: 'resumes',
    })
    
    if (filename) {
      params.append('filename', filename)
    }

    const response = await authenticatedFetch(`/convert?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })
    
    return handleApiResponse<{ storage: { public_url: string; url: string; signed_url?: string }; format: string }>(response)
  },

  /**
   * Edit text using AI
   */
  async editText(text: string, instruction: string): Promise<string> {
    const response = await authenticatedFetch('/edit-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, instruction }),
    })

    const result = await handleApiResponse<{ edited_text: string }>(response)
    return result.edited_text
  },

  /**
   * Parse a job description (text or URL)
   */
  async parseJobDescription(description: string, isUrl: boolean): Promise<JobData> {
    const formData = new FormData()

    if (isUrl) {
      formData.append('url', description)
    } else {
      formData.append('text', description)
    }

    const response = await authenticatedFetch('/parse/job', {
      method: 'POST',
      body: formData,
    })

    const result = await handleApiResponse<JobData & { job_json?: JobData }>(response)
    return result.job_json || result
  },

  /**
   * Match a resume against a job description
   */
  async matchResume(resume: ParsedResume, job: JobData): Promise<MatchResponse> {
    const payload = {
      resume_jsonresume: resume,
      job_json: job
    }

    const response = await authenticatedFetch('/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return handleApiResponse<MatchResponse>(response)
  },

  /**
   * Tailor a resume for a job
   */
  async tailorResume(
    resume: ParsedResume,
    job: JobData,
    fileName: string,
    historyId?: string | null,
    customPrompt?: string
  ): Promise<TailorResponse> {
    const payload = {
      resume_jsonresume: resume,
      job_json: job,
      ...(customPrompt && { custom_prompt: customPrompt })
    }

    const params = new URLSearchParams({
      format: 'pdf',
      store: 'true',
      bucket: 'resumes',
      filename: fileName
    })

    if (historyId) {
      params.append('history_id', historyId)
    }

    const response = await authenticatedFetch(`/tailor?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return handleApiResponse<TailorResponse>(response)
  },
}

