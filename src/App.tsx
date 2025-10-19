import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Link, Type, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Log the API URL being used (for debugging)
console.log('API Base URL:', API_BASE_URL)

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
  url: string
  path: string
  bucket: string
}

interface TailorResponse {
  storage: StorageInfo
  format: string
  note?: string
}

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [useDefaultPrompt, setUseDefaultPrompt] = useState(true)
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [tailoredResult, setTailoredResult] = useState<TailorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const tailorResume = async (resume: ParsedResume, job: JobData): Promise<TailorResponse> => {
    const payload = {
      resume_jsonresume: resume,
      job_json: job
    }

    const response = await fetch(`${API_BASE_URL}/tailor?format=pdf&store=true&bucket=resumes&filename=UI_Test`, {
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

  const downloadFile = async (url: string, filename: string) => {
    setIsDownloading(true)
    setError(null)
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      setError(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
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
      // Step 1: Parse resume
      console.log('Parsing resume...')
      const resume = await parseResume(resumeFile)
      setParsedResume(resume)
      console.log('Resume parsed:', resume)

      // Step 2: Parse job description
      console.log('Parsing job description...')
      const job = await parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)
      console.log('Job parsed:', job)

      // Step 3: Tailor resume
      console.log('Tailoring resume...')
      const result = await tailorResume(resume, job)
      setTailoredResult(result)
      console.log('Resume tailored:', result)

    } catch (err) {
      console.error('Processing failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Resume Analyzer</h1>
          <p className="text-slate-600">Upload your resume and job description to get personalized feedback</p>
        </div>

        <div className="space-y-8">
          {/* Resume Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Resume Upload</h2>
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              {isJobDescriptionLink ? (
                <Link className="h-5 w-5 text-green-600" />
              ) : (
                <Type className="h-5 w-5 text-green-600" />
              )}
              <h2 className="text-xl font-semibold text-slate-900">Job Description</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="job-link-toggle"
                  checked={isJobDescriptionLink}
                  onCheckedChange={(checked) => setIsJobDescriptionLink(checked as boolean)}
                />
                <Label htmlFor="job-link-toggle" className="text-sm font-medium text-slate-700">
                  Job description is a link
                </Label>
              </div>
              
              {isJobDescriptionLink ? (
                <div className="space-y-2">
                  <Label htmlFor="job-link" className="text-sm font-medium text-slate-700">
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
                  <Label htmlFor="job-description" className="text-sm font-medium text-slate-700">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
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
                  <h3 className="font-medium text-slate-900 mb-2">Parsed Job</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p><strong>Title:</strong> {parsedJob.title || 'N/A'}</p>
                    <p><strong>Company:</strong> {parsedJob.company || 'N/A'}</p>
                    <p><strong>Requirements:</strong> {parsedJob.requirements?.length || 0} items</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 
           Section */}
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
                  <button
                    onClick={() => downloadFile(
                      tailoredResult.storage.url, 
                      `tailored_resume.${tailoredResult.format}`
                    )}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download {tailoredResult.format.toUpperCase()} Resume
                      </>
                    )}
                  </button>
                  
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
    </div>
  )
}

export default App
