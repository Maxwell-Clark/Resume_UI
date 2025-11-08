import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Link, Type, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Popover } from "@/components/ui/popover"
import { saveHistoryItem, updateHistoryItem } from '@/lib/history'
import { useJobStatusPolling } from '@/hooks/useJobStatusPolling'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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
  const [prompt, setPrompt] = useState('')
  const [useDefaultPrompt, setUseDefaultPrompt] = useState(true)
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [tailoredResult, setTailoredResult] = useState<TailorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFileName] = useState<string>('Tailored_Resume')
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const navigate = useNavigate()

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
  })

  const defaultPrompt = "Please analyze this resume and job description to provide tailored feedback and suggestions for improvement."

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

    const response = await fetch(`${API_BASE_URL}/parse/resume`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Resume parsing failed: ${response.statusText}`)
    }

    return await response.json()
  }

  const parseJobDescription = async (description: string, isLink: boolean): Promise<JobData> => {
    const formData = new FormData()
    
    if (isLink) {
      formData.append('url', description)
    } else {
      formData.append('text', description)
    }

    const response = await fetch(`${API_BASE_URL}/parse/job`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Job parsing failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.job_json || result
  }

  const tailorResume = async (resume: ParsedResume, job: JobData, file_name: string): Promise<TailorResponse> => {
    const payload = {
      resume_jsonresume: resume,
      job_json: job
    }

    const response = await fetch(`${API_BASE_URL}/tailor?format=pdf&store=true&bucket=resumes&filename=${file_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resume tailoring failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
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

      // Step 4: Continue processing in background
      // Parse resume
      console.log('Parsing resume...')
      const resume = await parseResume(resumeFile)
      setParsedResume(resume)
      console.log('Resume parsed:', resume)

      // Tailor resume
      console.log('Tailoring resume...')
      const result = await tailorResume(resume, job, filename)
      console.log('Resume tailored:', result)

      // Update history entry with download URL and status
      await updateHistoryItem(historyItem.id, {
        download_url: result.storage.signed_url || result.storage.url,
        status: 'complete',
      })

      setCurrentHistoryId(null) // Stop polling
    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      
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
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resume Upload</h2>
          </div>
          <div className="space-y-4">
            <Label htmlFor="resume-upload" className="text-sm font-medium text-slate-700">
              Upload your resume (PDF only)
            </Label>
            <Input
              id="resume-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {resumeFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Upload className="h-4 w-4" />
                <span>Selected: {resumeFile.name}</span>
              </div>
            )}
          </div>
        </div>

          {/* Job Description Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            {isJobDescriptionLink ? (
              <Link className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Type className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Job Description</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="job-link-toggle"
                checked={isJobDescriptionLink}
                onCheckedChange={(checked) => setIsJobDescriptionLink(checked as boolean)}
              />
              <Label htmlFor="job-link-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Job description is a link
              </Label>
            </div>
            
            {isJobDescriptionLink ? (
              <div className="space-y-2">
                <Label htmlFor="job-link" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job posting URL
                </Label>
                <Input
                  id="job-link"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job description text
                </Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-32"
                />
              </div>
            )}
          </div>
        </div>

        <Popover
          trigger={<span>Open options</span>}
          align="start"
          side="bottom"
          sideOffset={8}
          contentClassName="p-0 rounded-xl overflow-hidden border bg-background"
        >
          <div className="w-[50rem] max-w-[200vw]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Type className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analysis Prompt</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="default-prompt"
                    checked={useDefaultPrompt}
                    onCheckedChange={(checked) => setUseDefaultPrompt(checked as boolean)}
                  />
                  <Label htmlFor="default-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Use default prompt
                  </Label>
                </div>
                
                {useDefaultPrompt ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{defaultPrompt}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="custom-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Custom prompt
                    </Label>
                    <Textarea
                      id="custom-prompt"
                      placeholder="Enter your custom analysis prompt..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Type className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100"> Tailered Resume File Name</h2>
              </div>
              <Label htmlFor="filename" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Output File Name (Optional)
              </Label>
              <Input 
                id="custom-prompt"
                placeholder="Enter the name of your tailored resume"
                value={filename}
                onChange={(e) => setFileName(e.target.value)}
                className="min-h-16"
              />
            </div>
          </div>
        </Popover>

        {/* Prompt Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-900">Analysis Prompt</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="default-prompt"
                checked={useDefaultPrompt}
                onCheckedChange={(checked) => setUseDefaultPrompt(checked as boolean)}
              />
              <Label htmlFor="default-prompt" className="text-sm font-medium text-slate-700">
                Use default prompt
              </Label>
            </div>
            
            {useDefaultPrompt ? (
              <div className="p-4 bg-slate-50 rounded-md">
                <p className="text-sm text-slate-600 italic">"{defaultPrompt}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="custom-prompt" className="text-sm font-medium text-slate-700">
                  Custom prompt
                </Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Enter your custom analysis prompt..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100"> Tailered Resume File Name</h2>
          </div>
          <Label htmlFor="filename" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Output File Name (Optional)
          </Label>
          <Input 
            id="custom-prompt"
            placeholder="Enter the name of your tailored resume"
            value={filename}
            onChange={(e) => setFileName(e.target.value)}
            className="min-h-16"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-8 py-3 text-lg font-medium"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Analyze Resume'
            )}
          </Button>
        </div>

          {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-300 font-medium">Error</span>
            </div>
            <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {parsedResume && parsedJob && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-slate-900">Analysis Complete</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Parsed Resume</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>Name:</strong> {parsedResume.person?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {parsedResume.person?.email || 'N/A'}</p>
                  <p><strong>Experience:</strong> {parsedResume.experience?.length || 0} positions</p>
                  <p><strong>Education:</strong> {parsedResume.education?.length || 0} entries</p>
                  <p><strong>Skills:</strong> {parsedResume.skills?.length || 0} skills</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Parsed Job</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong>Title:</strong> {parsedJob.title || 'N/A'}</p>
                  <p><strong>Company:</strong> {parsedJob.company || 'N/A'}</p>
                  <p><strong>Requirements:</strong> {parsedJob.requirements?.length || 0} items</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Section */}
        {tailoredResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Tailored Resume Ready</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800 mb-2">
                  Your tailored resume has been generated and stored in Supabase.
                </p>
                {tailoredResult.note && (
                  <p className="text-sm text-blue-700 italic">{tailoredResult.note}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <a
                  href={tailoredResult.storage.signed_url || tailoredResult.storage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download {tailoredResult.format.toUpperCase()} Resume
                </a>
                
                <div className="text-sm text-slate-600">
                  <p>Format: {tailoredResult.format}</p>
                  <p>Bucket: {tailoredResult.storage.bucket}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
