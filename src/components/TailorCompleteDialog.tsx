import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { Download, FileEdit, History, ArrowRight, Loader2, Wand2 } from 'lucide-react'
import { updateHistoryItem } from '@/lib/history'

export interface JobDetails {
  jobTitle: string
  company: string
  salaryRange?: string
  industry?: string
}

export interface TailorCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isProcessing?: boolean
  downloadUrl?: string
  historyId: string
  initialJobData: JobDetails
  onGoToEditor: () => void
  onGoToHistory: () => void
}

export function TailorCompleteDialog({
  open,
  onOpenChange,
  isProcessing = false,
  downloadUrl,
  historyId,
  initialJobData,
  onGoToEditor,
  onGoToHistory,
}: TailorCompleteDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isSaving, setIsSaving] = useState(false)

  // Editable job details
  const [jobTitle, setJobTitle] = useState(initialJobData.jobTitle)
  const [company, setCompany] = useState(initialJobData.company)
  const [salaryRange, setSalaryRange] = useState(initialJobData.salaryRange || '')
  const [industry, setIndustry] = useState(initialJobData.industry || '')

  // Reset form when initialJobData changes
  useEffect(() => {
    setJobTitle(initialJobData.jobTitle)
    setCompany(initialJobData.company)
    setSalaryRange(initialJobData.salaryRange || '')
    setIndustry(initialJobData.industry || '')
  }, [initialJobData])

  const handleContinue = async () => {
    setIsSaving(true)
    try {
      // Save updated job details to history (optional - don't block on failure)
      await updateHistoryItem(historyId, {
        job_title: jobTitle,
        company: company,
        salary_range: salaryRange || undefined,
        industry: industry || undefined,
      })
    } catch (error) {
      console.error('Failed to save job details:', error)
      // Continue anyway - these are optional fields
    } finally {
      setIsSaving(false)
      setStep(2)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const handleGoToEditor = () => {
    onGoToEditor()
    handleClose()
  }

  const handleGoToHistory = () => {
    onGoToHistory()
    handleClose()
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after dialog closes
    setTimeout(() => {
      setStep(1)
    }, 300)
  }

  const canDownload = !isProcessing && downloadUrl
  const canOpenEditor = !isProcessing && downloadUrl

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={step === 1 ? "Tailoring Started" : "What's Next?"}
      className="max-w-md"
    >
      {step === 1 ? (
        <div className="space-y-6">
          {/* Status Message */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              {isProcessing ? (
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : (
                <Wand2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isProcessing
                ? "Your resume is being tailored. Optionally update the job details below while you wait."
                : "Tailoring complete! Optionally update the job details below for your records."}
            </p>
          </div>

          {/* Job Details Form - All Optional */}
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center italic">
              All fields are optional
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-sm font-medium">
                  Job Title
                </Label>
                <Input
                  id="job-title"
                  type="text"
                  placeholder="e.g., Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g., Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary-range" className="text-sm font-medium">
                  Salary Range
                </Label>
                <Input
                  id="salary-range"
                  type="text"
                  placeholder="e.g., $100k - $150k"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </Label>
                <Input
                  id="industry"
                  type="text"
                  placeholder="e.g., Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Tailoring in progress...
              </span>
            </div>
          )}

          {/* Preview (if downloadUrl exists) */}
          {downloadUrl && (
            <div className="border dark:border-slate-700 rounded-lg overflow-hidden h-48">
              <iframe
                src={downloadUrl}
                className="w-full h-full border-0"
                title="Tailored Resume Preview"
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={!canDownload}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>

            <Button
              onClick={handleGoToEditor}
              className="w-full"
              size="lg"
              disabled={!canOpenEditor}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              {isProcessing ? 'Open in Editor (waiting...)' : 'Open in Editor'}
            </Button>

            <Button
              onClick={handleGoToHistory}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <History className="h-4 w-4 mr-2" />
              View in History
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            {isProcessing
              ? "You can navigate away - your tailored resume will be available in History when ready."
              : "You can always access your tailored resume from the History page."}
          </p>
        </div>
      )}
    </Dialog>
  )
}
