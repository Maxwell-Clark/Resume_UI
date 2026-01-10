import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resumeService, type Resume } from '@/services/resume'
import { FileText, Upload, Loader2, Search, Calendar } from 'lucide-react'

export type ResumeSelectionResult = 
  | { type: 'existing'; resume: Resume }
  | { type: 'upload'; file: File }

export type ResumeSelectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (result: ResumeSelectionResult) => void
}

type Mode = 'existing' | 'upload'

export function ResumeSelectionDialog({
  open,
  onOpenChange,
  onSelect,
}: ResumeSelectionDialogProps) {
  const [mode, setMode] = useState<Mode>('existing')
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loadingResume, setLoadingResume] = useState<string | null>(null)

  // Fetch resumes when dialog opens in existing mode
  useEffect(() => {
    if (open && mode === 'existing') {
      fetchResumes()
    }
  }, [open, mode])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const data = await resumeService.getResumes(100)
      setResumes(data)
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
      setResumes([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExisting = async (resumeId: string) => {
    setLoadingResume(resumeId)
    try {
      const fullResume = await resumeService.getResume(resumeId)
      onSelect({ type: 'existing', resume: fullResume })
      onOpenChange(false)
      // Reset state
      setSearchQuery('')
      setSelectedFile(null)
      setLoadingResume(null)
    } catch (error) {
      console.error('Failed to fetch resume:', error)
      setLoadingResume(null)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleUploadSelect = () => {
    if (selectedFile) {
      onSelect({ type: 'upload', file: selectedFile })
      onOpenChange(false)
      // Reset state
      setSearchQuery('')
      setSelectedFile(null)
    }
  }

  const filteredResumes = resumes.filter((resume) =>
    resume.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Resume"
      description="Choose an existing resume or upload a new one"
      className="max-w-2xl"
    >
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6 border-b dark:border-slate-700">
        <button
          onClick={() => setMode('existing')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            mode === 'existing'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Existing Resumes
          </div>
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            mode === 'upload'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New
          </div>
        </button>
      </div>

      {/* Existing Resumes Mode */}
      {mode === 'existing' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Loading resumes...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && resumes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No resumes found</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Upload a new resume to get started
              </p>
            </div>
          )}

          {/* No Results */}
          {!loading && resumes.length > 0 && filteredResumes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">No resumes match your search</p>
            </div>
          )}

          {/* Resume List */}
          {!loading && filteredResumes.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredResumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => handleSelectExisting(resume.id)}
                  disabled={loadingResume === resume.id}
                  className="w-full text-left p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {resume.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {formatDate(resume.updated_at)}</span>
                      </div>
                    </div>
                    {loadingResume === resume.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-upload-dialog" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Resume File (PDF only)
            </Label>
            <Input
              id="resume-upload-dialog"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
              <Upload className="h-4 w-4" />
              <span>Selected: {selectedFile.name}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSelect}
              disabled={!selectedFile}
            >
              Select File
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}








