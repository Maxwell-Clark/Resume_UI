import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Link, Type, Loader2, CheckCircle, AlertCircle, TrendingUp, ThumbsUp, AlertTriangle } from 'lucide-react'
import { authenticatedFetch, handleApiResponse } from '@/lib/auth'

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

export function ResumeMatchPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  // Store parsed data for potential future use or display
  const [, setParsedResume] = useState<ParsedResume | null>(null)
  const [, setParsedJob] = useState<JobData | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setMatchResult(null)

    try {
      // Step 1: Parse job description
      console.log('Parsing job description...')
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)
      console.log('Job parsed:', job)

      // Step 2: Parse resume
      console.log('Parsing resume...')
      const resume = await parseResume(resumeFile)
      setParsedResume(resume)
      console.log('Resume parsed:', resume)

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
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resume Upload</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Upload your resume in PDF format.
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
            disabled={isProcessing || !resumeFile || !jobDescription.trim()}
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
          </div>
        )}
      </div>
    </div>
  )
}
