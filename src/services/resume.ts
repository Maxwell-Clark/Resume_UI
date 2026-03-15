import { authenticatedFetch, handleApiResponse } from '@/lib/auth'
import type { ResumeContent, PersonInfo, WorkEntry, EducationEntry, SkillCategory } from '@/types/resume'

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
  content?: Partial<ResumeContent>
}

export interface ParsedResume {
  person?: PersonInfo
  basics?: PersonInfo
  experience?: WorkEntry[]
  work?: WorkEntry[]
  education?: EducationEntry[]
  skills?: SkillCategory[]
  [key: string]: unknown
}

export interface JobData {
  title: string
  company: string
  description: string
  requirements: string[]
  [key: string]: unknown
}

export interface MatchResponse {
  match_percentage: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

// Enhanced Match Response Types
export interface MatchScoreBreakdown {
  overall: number
  skills_match: number
  experience_match: number
  education_match: number
  ats_compatibility: number
  ai_role_fit: number
}

export interface ExperienceAnalysisResponse {
  years_required: number | null
  years_found: number
  relevance_score: number
  seniority_match: 'under' | 'match' | 'over'
  relevant_roles: string[]
}

export interface EducationAnalysisResponse {
  degree_match: boolean
  field_match: boolean
  degree_required?: string
  degree_found?: string
  field_required?: string
  field_found?: string
}

export interface StrengthItem {
  description: string
  confidence: number  // 0-100
  evidence: string[]
  category: string  // e.g., 'skills', 'experience', 'education'
}

export interface GapItem {
  description: string
  severity: 'critical' | 'important' | 'nice_to_have'
  category: string
  recommendation: string
}

export interface EnhancedMatchResponse {
  match_percentage: number
  score_breakdown: MatchScoreBreakdown
  experience_analysis?: ExperienceAnalysisResponse
  education_analysis?: EducationAnalysisResponse
  strengths: StrengthItem[]
  gaps: GapItem[]
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

export interface GuaranteedTailorResponse {
  storage: StorageInfo | null
  format: string
  baseline_score: number
  final_score: number
  score_improvement: number
  attempts: number
  verification_passed: boolean
  warnings: string[]
}

export interface TailorOptions {
  customPrompt?: string
  historyId?: string | null
  /** Enable verification loop to guarantee score improvement */
  guaranteed?: boolean
  /** Pre-computed match result to avoid re-computing baseline (saves 3-5s) */
  baselineMatch?: EnhancedMatchResponse
  /** Max retry attempts when guaranteed=true (0-5, default 2) */
  maxRetries?: number
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
 * Provides explicit, structured instructions to maximize match score
 */
export function generateRetailorPrompt(matchResult: EnhancedMatchResponse): string {
  // Format recommendations as explicit actions
  const recommendationActions = matchResult.recommendations.length > 0
    ? matchResult.recommendations.map((rec, idx) =>
        `  ACTION ${idx + 1}: ${rec}\n    → Apply this by: modifying relevant experience bullets and/or adding to skills section`
      ).join('\n')
    : '  No specific actions required.'

  // Sort gaps by severity: critical first, then important, then nice_to_have
  const sortedGaps = [...matchResult.gaps].sort((a, b) => {
    const severityOrder = { critical: 0, important: 1, nice_to_have: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  // Format gaps with severity and specific recommendations
  const criticalGaps = sortedGaps.filter(g => g.severity === 'critical')
  const importantGaps = sortedGaps.filter(g => g.severity === 'important')
  const niceToHaveGaps = sortedGaps.filter(g => g.severity === 'nice_to_have')

  const formatGapItem = (gap: GapItem, idx: number, prefix: string) => {
    const rec = gap.recommendation ? `\n    → Specific fix: ${gap.recommendation}` : ''
    return `  ${prefix} ${idx + 1} [${gap.category}]: ${gap.description}${rec}\n    → Address by: finding related experience in resume and emphasizing it, or adding relevant skill keywords`
  }

  let gapInstructions = ''
  if (criticalGaps.length > 0) {
    gapInstructions += `\n🚨 CRITICAL GAPS (must address - these significantly impact match score):\n`
    gapInstructions += criticalGaps.map((g, i) => formatGapItem(g, i, 'CRITICAL')).join('\n')
  }
  if (importantGaps.length > 0) {
    gapInstructions += `\n\n⚠️ IMPORTANT GAPS (should address for better match):\n`
    gapInstructions += importantGaps.map((g, i) => formatGapItem(g, i, 'IMPORTANT')).join('\n')
  }
  if (niceToHaveGaps.length > 0) {
    gapInstructions += `\n\n💡 NICE TO HAVE (address if possible with existing experience):\n`
    gapInstructions += niceToHaveGaps.map((g, i) => formatGapItem(g, i, 'OPTIONAL')).join('\n')
  }

  if (!gapInstructions) {
    gapInstructions = '  No gaps to address.'
  }

  return `${DEFAULT_TAILOR_PROMPT}

═══════════════════════════════════════════════════════════════
OPTIMIZATION OBJECTIVE - MAXIMIZE MATCH SCORE
═══════════════════════════════════════════════════════════════
Current match score: ${matchResult.match_percentage}%
Target: Achieve the highest possible match by applying ALL recommendations below.
${criticalGaps.length > 0 ? `\n⚠️ ${criticalGaps.length} CRITICAL gap(s) detected - prioritize addressing these first!` : ''}

REQUIRED ACTIONS (apply each one):
${recommendationActions}

GAPS TO ADDRESS (bridge each one using existing resume content):
${gapInstructions}

EXECUTION PRIORITY:
1. CRITICAL GAPS: Address all critical gaps first using existing truthful content.
2. SKILLS SECTION: Add/reorder skills to match job requirements.
3. EXPERIENCE BULLETS: Rewrite to incorporate recommendation themes. Use JD language where truthful.
4. SUMMARY: Align with job focus areas.

VERIFICATION CHECKLIST (ensure before output):
□ Every CRITICAL gap has been addressed with existing truthful content
□ Every recommendation action has been applied somewhere in the resume
□ Important gaps have been addressed where possible
□ Skills section prioritizes JD-relevant terms
□ Experience bullets use language that addresses identified gaps`
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
   * Match a resume against a job description (enhanced analysis)
   */
  async matchResume(resume: ParsedResume, job: JobData): Promise<EnhancedMatchResponse> {
    const payload = {
      resume_jsonresume: resume,
      job_json: job
    }

    const response = await authenticatedFetch('/match/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return handleApiResponse<EnhancedMatchResponse>(response)
  },

  /**
   * Tailor a resume for a job
   *
   * @param resume - Resume data in ParsedResume format
   * @param job - Job description data
   * @param fileName - Filename for the output
   * @param options - Optional TailorOptions for customization
   * @returns TailorResponse or GuaranteedTailorResponse when guaranteed=true
   */
  async tailorResume(
    resume: ParsedResume,
    job: JobData,
    fileName: string,
    options?: TailorOptions
  ): Promise<TailorResponse | GuaranteedTailorResponse> {
    const payload: Record<string, unknown> = {
      resume_jsonresume: resume,
      job_json: job,
    }

    if (options?.customPrompt) {
      payload.custom_prompt = options.customPrompt
    }

    // Include baseline match for guaranteed mode (saves 3-5s)
    if (options?.guaranteed && options?.baselineMatch) {
      payload.baseline_match = options.baselineMatch
    }

    const params = new URLSearchParams({
      format: 'pdf',
      store: 'true',
      bucket: 'resumes',
      filename: fileName
    })

    if (options?.historyId) {
      params.append('history_id', options.historyId)
    }

    if (options?.guaranteed) {
      params.append('guaranteed', 'true')
      if (options.maxRetries !== undefined) {
        params.append('max_retries', options.maxRetries.toString())
      }
    }

    const response = await authenticatedFetch(`/tailor?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (options?.guaranteed) {
      return handleApiResponse<GuaranteedTailorResponse>(response)
    }
    return handleApiResponse<TailorResponse>(response)
  },

  /**
   * Legacy tailorResume signature for backward compatibility
   * @deprecated Use tailorResume with TailorOptions instead
   */
  async tailorResumeLegacy(
    resume: ParsedResume,
    job: JobData,
    fileName: string,
    historyId?: string | null,
    customPrompt?: string
  ): Promise<TailorResponse> {
    return this.tailorResume(resume, job, fileName, {
      historyId,
      customPrompt,
    }) as Promise<TailorResponse>
  },
}

