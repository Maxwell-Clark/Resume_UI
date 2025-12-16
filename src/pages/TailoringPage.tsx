import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Link, Type, Download, Loader2, CheckCircle, AlertCircle, RotateCcw, FileEdit } from 'lucide-react'
import { saveHistoryItem, updateHistoryItem } from '@/lib/history'
import { useJobStatusPolling } from '@/hooks/useJobStatusPolling'
import { useNavigate } from 'react-router-dom'
import { authenticatedFetch, handleApiResponse } from '@/lib/auth'
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

export function TailoringPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
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
  const [prompt, setPrompt] = useState(defaultPrompt)
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [tailoredResult, setTailoredResult] = useState<TailorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFileName] = useState<string>('Tailored_Resume')
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  // Poll for job status when historyId is set
  useJobStatusPolling(currentHistoryId, (completedItem) => {
    setTailoredResult({
      storage: {
        url: completedItem.download_url || '',
        signed_url: completedItem.download_url || '',
        bucket: 'resumes',
        path: '',
      },
      format: 'pdf',
    })
    
    // Trigger success notification
    addNotification({
      title: 'Resume Tailored Successfully',
      message: `Your resume for ${completedItem.job_title} at ${completedItem.company} is ready.`,
      type: 'success'
    })
  })

  const handleResetPrompt = () => {
    setPrompt(defaultPrompt)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setResumeFile(file)
      setError(null)
    } else {
      setError('Please select a PDF file')
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

  const tailorResume = async (resume: ParsedResume, job: JobData, file_name: string, historyId?: string | null): Promise<TailorResponse> => {
    const payload = {
      resume_jsonresume: resume,
      job_json: job
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

  const handleSubmit = async () => {
    if (!resumeFile) {
      setError('Please upload a resume PDF')
      return
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    setTailoredResult(null)

    try {
      // Step 1: Parse job description first to get job info
      console.log('Parsing job description...')
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)
      console.log('Job parsed:', job)

      // Step 2: Create history entry immediately with "tailoring" status
      console.log('Creating history entry...')
      const historyItem = await saveHistoryItem({
        file_name: filename || 'Tailored_Resume',
        job_title: job.title || 'Unknown Position',
        company: job.company || 'Unknown Company',
        original_resume_name: resumeFile.name,
        status: 'tailoring',
      })
      setCurrentHistoryId(historyItem.id)
      console.log('History entry created:', historyItem)

      // Step 3: Navigate to history page immediately
      navigate('/history')
      
      // Add info notification that processing started
      addNotification({
        title: 'Tailoring Started',
        message: `We're tailoring your resume for ${job.title} at ${job.company}. You'll be notified when it's ready.`,
        type: 'info'
      })

      // Step 4: Continue processing in background
      // Parse resume
      console.log('Parsing resume...')
      const resume = await parseResume(resumeFile)
      setParsedResume(resume)
      console.log('Resume parsed:', resume)

      // Tailor resume (pass history_id so backend can update it automatically)
      console.log('Tailoring resume...')
      const result = await tailorResume(resume, job, filename, historyItem.id)
      console.log('Resume tailored:', result)

      // History entry is automatically updated by the backend, but we can still update status_dates if needed
      // The backend handles the download_url and status update
      try {
        await updateHistoryItem(historyItem.id, {
          status: 'complete',
        })
      } catch (updateError) {
        // Backend should have already updated it, so this is just a fallback
        console.warn('Frontend history update failed (backend may have already updated):', updateError)
      }

      setCurrentHistoryId(null) // Stop polling
    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      
      // Add error notification
      addNotification({
        title: 'Tailoring Failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred while tailoring your resume.',
        type: 'error'
      })
      
      // Update history entry status to failed if we have a history ID
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tailor Your Resume</h1>
        <p className="text-slate-600 dark:text-slate-400">Upload your resume and job description to Tailor your Resume to exactly what the job description requires</p>
      </div>

      <div className="space-y-8">
        {/* Resume Upload Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resume Upload</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Upload your resume in PDF format. The system will analyze and tailor it based on the job description you provide.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-upload" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Resume File (PDF only)
              </Label>
              <Input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
              />
            </div>
            {resumeFile && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
                <Upload className="h-4 w-4" />
                <span>Selected: {resumeFile.name}</span>
              </div>
            )}
          </div>
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
            Provide the job description either as a URL link or by pasting the text directly. This will be used to tailor your resume.
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the full URL of the job posting page
                </p>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste the complete job description including requirements, responsibilities, and qualifications
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Customization Options Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Customization Options</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Customize the analysis prompt and output filename for your tailored resume</p>
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize the prompt used to analyze and tailor your resume. The default prompt is optimized for general use.
              </p>
              <Textarea
                id="analysis-prompt"
                placeholder="Enter your custom analysis prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Output Filename */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <Label htmlFor="output-filename" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Output File Name
                </Label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optional: Specify a custom name for your tailored resume file. If left empty, "Tailored_Resume" will be used.
              </p>
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
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || !resumeFile || !jobDescription.trim()}
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

        {/* Results Section */}
        {parsedResume && parsedJob && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analysis Complete</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Parsed Resume</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong className="text-slate-900 dark:text-slate-100">Name:</strong> {parsedResume.person?.name || 'N/A'}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Email:</strong> {parsedResume.person?.email || 'N/A'}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Experience:</strong> {parsedResume.experience?.length || 0} positions</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Education:</strong> {parsedResume.education?.length || 0} entries</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Skills:</strong> {parsedResume.skills?.length || 0} skills</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Parsed Job</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong className="text-slate-900 dark:text-slate-100">Title:</strong> {parsedJob.title || 'N/A'}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Company:</strong> {parsedJob.company || 'N/A'}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Requirements:</strong> {parsedJob.requirements?.length || 0} items</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Section */}
        {tailoredResult && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tailored Resume Ready</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                  Your tailored resume has been generated and stored in Supabase.
                </p>
                {tailoredResult.note && (
                  <p className="text-sm text-blue-700 dark:text-blue-400 italic">{tailoredResult.note}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={tailoredResult.storage.signed_url || tailoredResult.storage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  <Download className="h-4 w-4" />
                  Download {tailoredResult.format.toUpperCase()} Resume
                </a>
                
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p><strong className="text-slate-900 dark:text-slate-100">Format:</strong> {tailoredResult.format.toUpperCase()}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Bucket:</strong> {tailoredResult.storage.bucket}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
