import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileText, Link, Type, Loader2, CheckCircle, AlertCircle, TrendingUp, ThumbsUp, AlertTriangle, RefreshCw } from 'lucide-react'
import { authenticatedFetch, handleApiResponse } from '@/lib/auth'
import { ResumeSelectionDialog, type ResumeSelectionResult } from '@/components/ResumeSelectionDialog'
import { type Resume } from '@/services/resume'
import { useNavigate } from 'react-router-dom'
import { saveHistoryItem, updateHistoryItem } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'

interface ParsedResume {
  person: any
  experience: any[]
  education: any[]
  skills: any[]
  [key: string]: any
}

interface JobData {
  title: string
  company: string
  description: string
  requirements: string[]
  [key: string]: any
}

interface MatchResponse {
  match_percentage: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

interface TailorResponse {
  storage: {
    url?: string
    signed_url?: string
    path: string
    bucket: string
  }
  format: string
  note?: string
}

export function ResumeMatchPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [resumeSelectionDialogOpen, setResumeSelectionDialogOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  // Store parsed data for potential future use or display
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Retailoring states
  const [isRetailoring, setIsRetailoring] = useState(false)
  const [retailorHistoryId, setRetailorHistoryId] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  const handleResumeSelection = (result: ResumeSelectionResult) => {
    if (result.type === 'existing') {
      setSelectedResume(result.resume)
      setResumeFile(null)
      setError(null)
    } else {
      setResumeFile(result.file)
      setSelectedResume(null)
      setError(null)
    }
  }

  const parseResume = async (file: File): Promise<ParsedResume> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', 'custom')

    const response = await authenticatedFetch('/parse/resume', {
      method: 'POST',
      body: formData,
    })

    return await handleApiResponse<ParsedResume>(response)
  }

  const parseJobDescription = async (description: string, isLink: boolean): Promise<JobData> => {
    const formData = new FormData()
    
    if (isLink) {
      formData.append('url', description)
    } else {
      formData.append('text', description)
    }

    const response = await authenticatedFetch('/parse/job', {
      method: 'POST',
      body: formData,
    })

    const result = await handleApiResponse<JobData>(response)
    // The backend might return different structures, handled by handleApiResponse but we ensure typing here
    return result.job_json || result
  }

  const matchResume = async (resume: ParsedResume, job: JobData): Promise<MatchResponse> => {
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

    return await handleApiResponse<MatchResponse>(response)
  }

  const handleSubmit = async () => {
    if (!resumeFile && !selectedResume) {
      setError('Please select or upload a resume')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    setMatchResult(null)

    try {
      // Step 1: Parse job description
      console.log('Parsing job description...')
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)
      console.log('Job parsed:', job)

      // Step 2: Get resume data (either from existing or parse new)
      let resume: ParsedResume
      if (selectedResume) {
        // Use existing resume JSON directly (skip parsing)
        console.log('Using existing resume JSON (skipping parse)...')
        resume = selectedResume.content as ParsedResume
        setParsedResume(resume)
        console.log('Resume loaded from existing:', resume)
      } else if (resumeFile) {
        // Parse new resume
        console.log('Parsing resume...')
        resume = await parseResume(resumeFile)
        setParsedResume(resume)
        console.log('Resume parsed:', resume)
      } else {
        throw new Error('No resume selected or uploaded')
      }

      // Step 3: Match resume
      console.log('Matching resume...')
      const result = await matchResume(resume, job)
      setMatchResult(result)
      console.log('Match result:', result)

    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const defaultPrompt = `Tailor the resume to achieve maximum alignment with the job description. Return ONLY a single valid JSON object matching the JSON Resume schema. Do NOT include Markdown, code fences, LaTeX, or any text outside the JSON.

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

  const generateRetailorPrompt = (matchResult: MatchResponse): string => {
    const gapsText = matchResult.gaps.length > 0
      ? `\n- The following gaps were identified:\n${matchResult.gaps.map(gap => `  • ${gap}`).join('\n')}`
      : '\n- No significant gaps were identified.'

    const recommendationsText = matchResult.recommendations.length > 0
      ? `\n- Recommended improvements:\n${matchResult.recommendations.map((rec, idx) => `  ${idx + 1}. ${rec}`).join('\n')}`
      : '\n- No specific recommendations provided.'

    return `${defaultPrompt}

MATCH ANALYSIS RESULTS:
The resume was analyzed against the job description and achieved a ${matchResult.match_percentage}% match score.${gapsText}${recommendationsText}

PRIORITY FOCUS:
- Address the identified gaps by incorporating relevant skills, experiences, or achievements that align with the job requirements.
- Prioritize improvements that will increase the match score while maintaining truth and accuracy.
- Emphasize the recommended improvements in the resume tailoring process.
- Focus on bridging the gap between current resume content and job requirements through strategic rewording and emphasis.`
  }

  const tailorResume = async (resume: ParsedResume, job: JobData, file_name: string, historyId?: string | null, customPrompt?: string): Promise<TailorResponse> => {
    const payload = {
      resume_jsonresume: resume,
      job_json: job,
      ...(customPrompt && { custom_prompt: customPrompt })
    }

    // Build query parameters
    const params = new URLSearchParams({
      format: 'pdf',
      store: 'true',
      bucket: 'resumes',
      filename: file_name
    })
    
    // Add history_id if provided
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

    return await handleApiResponse<TailorResponse>(response)
  }

  const handleRetailor = async () => {
    if (!parsedResume || !parsedJob || !matchResult) {
      setError('Resume and job data are required for retailoring')
      return
    }

    setIsRetailoring(true)
    setError(null)

    try {
      // Generate custom prompt from match results
      const customPrompt = generateRetailorPrompt(matchResult)
      console.log('Generated retailor prompt:', customPrompt)

      // Create history entry immediately with "tailoring" status
      console.log('Creating history entry for retailor...')
      const historyItem = await saveHistoryItem({
        file_name: `Retailored_Resume_${parsedJob.title || 'Position'}`,
        job_title: parsedJob.title || 'Unknown Position',
        company: parsedJob.company || 'Unknown Company',
        original_resume_name: selectedResume?.name || resumeFile?.name || 'Resume',
        status: 'tailoring',
      })
      setRetailorHistoryId(historyItem.id)
      console.log('History entry created:', historyItem)

      // Store the history ID in localStorage so HistoryPage can track it
      localStorage.setItem('pending_tailoring_id', historyItem.id)

      // Navigate to history page immediately
      navigate('/history', { 
        state: { forceRefresh: true, newHistoryId: historyItem.id },
        replace: false
      })

      // Add info notification that processing started
      addNotification({
        title: 'Retailoring Started',
        message: `We're retailoring your resume based on the match analysis. You'll be notified when it's ready.`,
        type: 'info'
      })

      // Tailor resume with custom prompt
      console.log('Retailoring resume...')
      const result = await tailorResume(
        parsedResume,
        parsedJob,
        `Retailored_Resume_${parsedJob.title || 'Position'}`,
        historyItem.id,
        customPrompt
      )
      console.log('Resume retailored:', result)

      // History entry is automatically updated by the backend, but we can still update status_dates if needed
      try {
        await updateHistoryItem(historyItem.id, {
          status: 'complete',
        })
      } catch (updateError) {
        // Backend should have already updated it, so this is just a fallback
        console.warn('Frontend history update failed (backend may have already updated):', updateError)
      }

      setRetailorHistoryId(null)
    } catch (err) {
      console.error('Retailoring failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while retailoring your resume.')
      
      // Add error notification
      addNotification({
        title: 'Retailoring Failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while retailoring your resume.',
        type: 'error'
      })
      
      // Update history entry status to failed if we have a history ID
      if (retailorHistoryId) {
        try {
          await updateHistoryItem(retailorHistoryId, {
            status: 'failed',
          })
        } catch (updateError) {
          console.error('Failed to update history status:', updateError)
        }
        setRetailorHistoryId(null)
      }
    } finally {
      setIsRetailoring(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Resume Match</h1>
        <p className="text-slate-600 dark:text-slate-400">Upload your resume and job description to see how well they match and get improvement tips.</p>
      </div>

      <div className="space-y-8">
        {/* Resume Upload Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resume Selection</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Select an existing resume or upload a new one in PDF format.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Resume
              </Label>
              <Button
                id="resume-select"
                type="button"
                variant="outline"
                onClick={() => setResumeSelectionDialogOpen(true)}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {selectedResume ? `Selected: ${selectedResume.name}` : resumeFile ? `Selected: ${resumeFile.name}` : 'Select or Upload Resume'}
              </Button>
            </div>
            {(resumeFile || selectedResume) && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {selectedResume 
                    ? `Using existing resume: ${selectedResume.name}` 
                    : `Selected: ${resumeFile?.name}`}
                </span>
              </div>
            )}
          </div>
          <ResumeSelectionDialog
            open={resumeSelectionDialogOpen}
            onOpenChange={setResumeSelectionDialogOpen}
            onSelect={handleResumeSelection}
          />
        </div>

        {/* Job Description Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            {isJobDescriptionLink ? (
              <Link className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Type className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Job Description</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Provide the job description either as a URL link or by pasting the text directly.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="job-link-toggle"
                checked={isJobDescriptionLink}
                onCheckedChange={(checked) => setIsJobDescriptionLink(checked as boolean)}
              />
              <Label htmlFor="job-link-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Job description is a URL link
              </Label>
            </div>
            
            {isJobDescriptionLink ? (
              <div className="space-y-2">
                <Label htmlFor="job-link" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job Posting URL
                </Label>
                <Input
                  id="job-link"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full text-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job Description Text
                </Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-32 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || (!resumeFile && !selectedResume) || !jobDescription.trim()}
            className="px-10 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Match...
              </>
            ) : (
              'Check Match'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-red-800 dark:text-red-300 font-semibold block mb-1">Error</span>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Match Results */}
        {matchResult && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Match Analysis</h2>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score:</span>
                <span className={`text-2xl font-bold ${getMatchColor(matchResult.match_percentage)}`}>
                  {matchResult.match_percentage}%
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-5 w-5" />
                  <h3 className="font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {matchResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-semibold">Missing Requirements</h3>
                </div>
                <ul className="space-y-2">
                  {matchResult.gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-8 pt-6 border-t dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Recommended Improvements</h3>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                <ul className="space-y-3">
                  {matchResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="pt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Retailor Button */}
            <div className="mt-8 pt-6 border-t dark:border-slate-700">
              <div className="flex justify-center">
                <Button
                  onClick={handleRetailor}
                  disabled={isRetailoring || !parsedResume || !parsedJob}
                  className="px-8 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  {isRetailoring ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Retailoring...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Retailor Resume
                    </>
                  )}
                </Button>
              </div>
              {parsedResume && parsedJob && (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-3">
                  Tailor your resume using the match analysis recommendations to improve your match score.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
