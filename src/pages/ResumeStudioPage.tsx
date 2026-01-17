import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  FileText, Link, Type, Loader2, CheckCircle, AlertCircle,
  RotateCcw, FileEdit, Wand2, Target, Plus, TrendingUp, ThumbsUp,
  AlertTriangle, RefreshCw
} from 'lucide-react'
import { saveHistoryItem, updateHistoryItem, getHistoryItemByResumeId, getHistoryItemById } from '@/lib/history'
import { useJobStatusPolling } from '@/hooks/useJobStatusPolling'
import { authenticatedFetch, handleApiResponse } from '@/lib/auth'
import { useNotifications } from '@/contexts/NotificationContext'
import { ResumeSelectionDialog, type ResumeSelectionResult } from '@/components/ResumeSelectionDialog'
import { TailorCompleteDialog } from '@/components/TailorCompleteDialog'
import { type Resume, resumeService } from '@/services/resume'
import { cn } from '@/lib/utils'

// Shared interfaces
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

interface StorageInfo {
  url?: string
  signed_url?: string
  path: string
  bucket: string
}

interface TailorResponse {
  storage: StorageInfo
  format: string
  note?: string
}

interface MatchResponse {
  match_percentage: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}

type TabType = 'studio' | 'create'

const DEFAULT_PROMPT = `Tailor the resume to achieve maximum alignment with the job description. Return ONLY a single valid JSON object matching the JSON Resume schema. Do NOT include Markdown, code fences, LaTeX, or any text outside the JSON.

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

// ============================================================================
// STUDIO TAB COMPONENT (Combined Tailor + Match)
// ============================================================================
function StudioTab() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [resumeSelectionDialogOpen, setResumeSelectionDialogOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [isProcessing, setIsProcessing] = useState(false)
  const [_parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [_parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFileName] = useState<string>('Tailored_Resume')
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  
  // Match functionality state
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null)
  const [isCheckingMatch, setIsCheckingMatch] = useState(false)
  const [showMatchResults, setShowMatchResults] = useState(false)
  
  // Optional fields for history (values populated from parsed job, used by dialog)
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [salaryRange] = useState('')
  const [industry] = useState('')

  // TailorCompleteDialog state
  const [showTailorCompleteDialog, setShowTailorCompleteDialog] = useState(false)
  const [tailorDialogData, setTailorDialogData] = useState<{
    historyId: string
    jobTitle: string
    company: string
    salaryRange?: string
    industry?: string
  } | null>(null)
  const [tailorDownloadUrl, setTailorDownloadUrl] = useState<string | undefined>(undefined)

  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  useJobStatusPolling(currentHistoryId, (completedItem) => {
    // Update the download URL when tailoring completes
    setTailorDownloadUrl(completedItem.download_url || '')
    setCurrentHistoryId(null)

    addNotification({
      title: 'Resume Tailored Successfully',
      message: `Your resume for ${completedItem.job_title} at ${completedItem.company} is ready.`,
      type: 'success'
    })
  })

  const handleResetPrompt = () => {
    setPrompt(DEFAULT_PROMPT)
  }

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
    return result.job_json || result
  }

  const tailorResume = async (resume: ParsedResume, job: JobData, file_name: string, historyId?: string | null, customPrompt?: string): Promise<TailorResponse> => {
    const payload = {
      resume_jsonresume: resume,
      job_json: job,
      ...(customPrompt && { custom_prompt: customPrompt })
    }

    const params = new URLSearchParams({
      format: 'pdf',
      store: 'true',
      bucket: 'resumes',
      filename: file_name
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

    return await handleApiResponse<TailorResponse>(response)
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

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const generateRetailorPrompt = (matchResult: MatchResponse): string => {
    const gapsText = matchResult.gaps.length > 0
      ? `\n- The following gaps were identified:\n${matchResult.gaps.map(gap => `  • ${gap}`).join('\n')}`
      : '\n- No significant gaps were identified.'

    const recommendationsText = matchResult.recommendations.length > 0
      ? `\n- Recommended improvements:\n${matchResult.recommendations.map((rec, idx) => `  ${idx + 1}. ${rec}`).join('\n')}`
      : '\n- No specific recommendations provided.'

    return `${DEFAULT_PROMPT}

MATCH ANALYSIS RESULTS:
The resume was analyzed against the job description and achieved a ${matchResult.match_percentage}% match score.${gapsText}${recommendationsText}

PRIORITY FOCUS:
- Address the identified gaps by incorporating relevant skills, experiences, or achievements that align with the job requirements.
- Prioritize improvements that will increase the match score while maintaining truth and accuracy.
- Emphasize the recommended improvements in the resume tailoring process.
- Focus on bridging the gap between current resume content and job requirements through strategic rewording and emphasis.`
  }

  const handleCheckMatch = async () => {
    if (!resumeFile && !selectedResume) {
      setError('Please select or upload a resume')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }

    setIsCheckingMatch(true)
    setError(null)
    setMatchResult(null)

    try {
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)
      
      // Pre-fill optional fields from parsed job if not already set
      if (!jobTitle && job.title) setJobTitle(job.title)
      if (!companyName && job.company) setCompanyName(job.company)

      let resume: ParsedResume
      if (selectedResume) {
        resume = selectedResume.content as ParsedResume
        setParsedResume(resume)
      } else if (resumeFile) {
        resume = await parseResume(resumeFile)
        setParsedResume(resume)
      } else {
        throw new Error('No resume selected or uploaded')
      }

      const result = await matchResume(resume, job)
      setMatchResult(result)
      setShowMatchResults(true)

      // If match results available, use them to enhance the prompt
      setPrompt(generateRetailorPrompt(result))

      // Save match results immediately if using an existing resume
      if (selectedResume?.id) {
        try {
          const existingHistory = await getHistoryItemByResumeId(selectedResume.id)
          if (existingHistory) {
            await updateHistoryItem(existingHistory.id, {
              match_results: {
                match_percentage: result.match_percentage,
                strengths: result.strengths,
                gaps: result.gaps,
                recommendations: result.recommendations,
                matched_at: new Date().toISOString(),
              }
            })
          }
        } catch (saveErr) {
          console.warn('Could not save match results to history:', saveErr)
          // Don't block the UI - match results are still displayed
        }
      }

    } catch (err) {
      console.error('Match analysis failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsCheckingMatch(false)
    }
  }

  // Handle tailor button click - starts tailoring immediately and shows dialog in parallel
  const handleTailor = async (useEnhancedPrompt = false) => {
    if (!resumeFile && !selectedResume) {
      setError('Please select or upload a resume')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }
    if (useEnhancedPrompt && !matchResult) {
      setError('Match analysis is required for Tailor with Suggestions')
      return
    }

    setIsProcessing(true)
    setError(null)
    setTailorDownloadUrl(undefined)

    try {
      // Parse job description
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)

      // Determine which prompt to use
      const tailorPrompt = useEnhancedPrompt && matchResult ? generateRetailorPrompt(matchResult) : prompt

      // Create history entry immediately
      const historyItem = await saveHistoryItem({
        file_name: filename || 'Tailored_Resume',
        job_title: jobTitle || job.title || 'Unknown Position',
        company: companyName || job.company || 'Unknown Company',
        original_resume_name: resumeFile?.name || selectedResume?.name || 'Resume',
        status: 'tailoring',
        favorited: false,
        salary_range: salaryRange || undefined,
        industry: industry || undefined,
        match_results: matchResult ? {
          match_percentage: matchResult.match_percentage,
          strengths: matchResult.strengths,
          gaps: matchResult.gaps,
          recommendations: matchResult.recommendations,
          matched_at: new Date().toISOString(),
        } : undefined,
        job_json: job,
      })
      setCurrentHistoryId(historyItem.id)

      localStorage.setItem('pending_tailoring_id', historyItem.id)

      // Show the dialog immediately with history data
      setTailorDialogData({
        historyId: historyItem.id,
        jobTitle: jobTitle || job.title || 'Unknown Position',
        company: companyName || job.company || 'Unknown Company',
        salaryRange: salaryRange || undefined,
        industry: industry || undefined,
      })
      setShowTailorCompleteDialog(true)

      // Parse resume
      let resume: ParsedResume
      if (selectedResume) {
        resume = selectedResume.content as ParsedResume
        setParsedResume(resume)
      } else if (resumeFile) {
        resume = await parseResume(resumeFile)
        setParsedResume(resume)
      } else {
        throw new Error('No resume selected or uploaded')
      }

      // Start tailoring
      const tailorResult = await tailorResume(resume, job, filename, historyItem.id, tailorPrompt)

      try {
        await updateHistoryItem(historyItem.id, {
          status: 'complete',
        })
      } catch (updateError) {
        console.warn('Frontend history update failed (backend may have already updated):', updateError)
      }

      // Update download URL when complete
      const downloadUrl = tailorResult.storage.signed_url || tailorResult.storage.url || ''
      setTailorDownloadUrl(downloadUrl)
      setCurrentHistoryId(null)

      addNotification({
        title: 'Resume Tailored Successfully',
        message: `Your resume for ${job.title} at ${job.company} is ready.`,
        type: 'success'
      })
    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')

      addNotification({
        title: 'Tailoring Failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while tailoring your resume.',
        type: 'error'
      })

      // Close the dialog on error
      setShowTailorCompleteDialog(false)

      if (currentHistoryId) {
        try {
          await updateHistoryItem(currentHistoryId, {
            status: 'failed',
          })
        } catch (updateError) {
          console.error('Failed to update history status:', updateError)
        }
        setCurrentHistoryId(null)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Output File Name</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Provide a Name for the Output File. This will be used to name the file that is downloaded.
        </p>
          <div className="space-y-3">
        <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <Label htmlFor="output-filename" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Output File Name
            </Label>
        </div>
        <Input
            id="output-filename"
            type="text"
            placeholder="Tailored_Resume"
            value={filename}
            onChange={(e) => setFileName(e.target.value)}
            className="text-slate-900 dark:text-slate-100"
        />
        </div>  
        </div>

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
              id="job-link-toggle-tailor"
              checked={isJobDescriptionLink}
              onCheckedChange={(checked) => setIsJobDescriptionLink(checked as boolean)}
            />
            <Label htmlFor="job-link-toggle-tailor" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Job description is a URL link
            </Label>
          </div>
          
          {isJobDescriptionLink ? (
            <div className="space-y-2">
              <Label htmlFor="job-link-tailor" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Job Posting URL
              </Label>
              <Input
                id="job-link-tailor"
                type="url"
                placeholder="https://example.com/job-posting"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="job-description-tailor" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Job Description Text
              </Label>
              <Textarea
                id="job-description-tailor"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-32 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* Check Match Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Match Analysis</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Optional: Check how well your resume matches the job before tailoring</p>
          </div>
          <Button
            onClick={handleCheckMatch}
            disabled={isCheckingMatch || (!resumeFile && !selectedResume) || !jobDescription.trim()}
            variant="outline"
            className="shrink-0"
          >
            {isCheckingMatch ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Check Match
              </>
            )}
          </Button>
        </div>
        
        {/* Match Results */}
        {matchResult && showMatchResults && (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Match Analysis</h3>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score:</span>
                <span className={`text-2xl font-bold ${getMatchColor(matchResult.match_percentage)}`}>
                  {matchResult.match_percentage}%
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-5 w-5" />
                  <h4 className="font-semibold">Strengths</h4>
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
                  <h4 className="font-semibold">Missing Requirements</h4>
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
            <div className="mb-6 pt-4 border-t dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Recommended Improvements</h4>
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

            <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-6">
              The tailoring prompt has been updated to address the identified gaps.
            </p>

            {/* Tailor Buttons - Side by Side */}
            <div className="pt-4 border-t dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Tailor Button */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={() => handleTailor(false)}
                    disabled={isProcessing || (!resumeFile && !selectedResume) || !jobDescription.trim()}
                    variant="outline"
                    className="w-full px-6 py-6 text-lg font-semibold"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Tailor Resume
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Standard tailoring using your custom prompt
                  </p>
                </div>

                {/* Tailor with Suggestions Button */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={() => handleTailor(true)}
                    disabled={isProcessing || (!resumeFile && !selectedResume) || !jobDescription.trim()}
                    className="w-full px-6 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Tailor with Suggestions
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Uses match analysis to optimize your resume
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customization Options Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Tailor Prompt</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Customize the analysis prompt and output filename</p>
        </div>

        <div className="space-y-6">
          {/* Analysis Prompt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <Label htmlFor="analysis-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Analysis Prompt
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetPrompt}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset to Default
              </Button>
            </div>
            <Textarea
              id="analysis-prompt"
              placeholder="Enter your custom analysis prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Submit Button - Only show when no match results (buttons move to match results section when available) */}
      {!(matchResult && showMatchResults) && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => handleTailor(false)}
            disabled={isProcessing || (!resumeFile && !selectedResume) || !jobDescription.trim()}
            className="px-10 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Tailor Resume'
            )}
          </Button>
        </div>
      )}

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

      {/* Results Section
      {_parsedResume && _parsedJob && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analysis Complete</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Parsed Resume</h3>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong className="text-slate-900 dark:text-slate-100">Name:</strong> {_parsedResume.person?.name || 'N/A'}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Email:</strong> {_parsedResume.person?.email || 'N/A'}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Experience:</strong> {_parsedResume.experience?.length || 0} positions</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Parsed Job</h3>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p><strong className="text-slate-900 dark:text-slate-100">Title:</strong> {_parsedJob.title || 'N/A'}</p>
                <p><strong className="text-slate-900 dark:text-slate-100">Company:</strong> {_parsedJob.company || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Tailor Complete Dialog */}
      {tailorDialogData && (
        <TailorCompleteDialog
          open={showTailorCompleteDialog}
          onOpenChange={setShowTailorCompleteDialog}
          isProcessing={isProcessing}
          downloadUrl={tailorDownloadUrl}
          historyId={tailorDialogData.historyId}
          initialJobData={{
            jobTitle: tailorDialogData.jobTitle,
            company: tailorDialogData.company,
            salaryRange: tailorDialogData.salaryRange,
            industry: tailorDialogData.industry,
          }}
          onGoToEditor={async () => {
            // Fetch the history item to get the resume_id
            try {
              const historyItem = await getHistoryItemById(tailorDialogData.historyId)
              if (historyItem?.resume_id) {
                navigate(`/editor/${historyItem.resume_id}`)
                return
              }
              navigate('/history')
            } catch {
              navigate('/history')
            }
          }}
          onGoToHistory={() => navigate('/history')}
        />
      )}
    </div>
  )
}

// ============================================================================
// CREATE TAB COMPONENT
// ============================================================================
function CreateTab() {
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const [resumeName, setResumeName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateNew = async () => {
    if (!resumeName.trim()) {
      setError('Please enter a name for your resume')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // Create an empty resume with the JSON Resume structure
      const emptyResumeContent = {
        basics: {
          name: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          summary: ''
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        awards: [],
        volunteer: [],
        publications: [],
        languages: [],
        interests: [],
        references: []
      }

      const newResume = await resumeService.createResume({
        name: resumeName.trim(),
        content: emptyResumeContent
      })

      // Create a history entry so it appears on the History page
      await saveHistoryItem({
        file_name: resumeName.trim(),
        job_title: 'New Resume',
        company: 'From Scratch',
        status: 'complete',
        resume_id: newResume.id,
        favorited: false,
      })

      addNotification({
        title: 'Resume Created',
        message: `"${resumeName.trim()}" has been created. You can now fill in your details.`,
        type: 'success'
      })

      // Navigate to the editor with the new resume ID
      navigate(`/editor/${newResume.id}`)
    } catch (err) {
      console.error('Failed to create resume:', err)
      setError('Failed to create resume. Please try again.')
      addNotification({
        title: 'Error',
        message: 'Failed to create resume. Please try again.',
        type: 'error'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-12 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Plus className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Create a New Resume
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Start fresh with our resume editor. Build your professional resume from scratch with our easy-to-use form.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resume-name" className="text-sm font-medium">
              Resume Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="resume-name"
              type="text"
              placeholder="e.g., Software Engineer Resume, Marketing Resume 2025..."
              value={resumeName}
              onChange={(e) => {
                setResumeName(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreateNew()
                }
              }}
              className={cn(
                "w-full",
                error && "border-red-500 focus:ring-red-500"
              )}
              disabled={isCreating}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Give your resume a descriptive name to help you identify it later.
            </p>
          </div>

          <Button 
            onClick={handleCreateNew}
            disabled={isCreating || !resumeName.trim()}
            className="w-full px-8 py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Create Resume
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN RESUME STUDIO PAGE
// ============================================================================
export function ResumeStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  // Handle legacy 'tailor' and 'match' tabs by redirecting to 'studio'
  const currentTab: TabType = (tabParam === 'tailor' || tabParam === 'match') ? 'studio' : ((tabParam as TabType) || 'studio')

  const tabs: { id: TabType; label: string; icon: typeof Wand2 }[] = [
    { id: 'studio', label: 'Tailor Resume', icon: Wand2 },
    { id: 'create', label: 'Create New', icon: Plus },
  ]

  const handleTabChange = (tabId: TabType) => {
    setSearchParams({ tab: tabId })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Resume Studio</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Tailor, analyze, or create your perfect resume
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  )}
                >
                  <Icon className={cn(
                    'h-10 w-10',
                    isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500'
                  )} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === 'studio' && <StudioTab />}
        {currentTab === 'create' && <CreateTab />}
      </div>
    </div>
  )
}

