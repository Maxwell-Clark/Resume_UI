import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { Loader2, Link, Type, Target, RefreshCw, Wand2, Lightbulb } from 'lucide-react'
import { resumeService, type ParsedResume, type JobData, type EnhancedMatchResponse } from '@/services/resume'
import { updateHistoryItem, type MatchResults } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'
import { StrengthCard } from '@/components/StrengthCard'
import { GapCard } from '@/components/GapCard'

export interface NewMatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeContent: Record<string, unknown>
  historyItemId?: string
  onMatchComplete: (results: MatchResults, jobData: JobData) => void
  onRetailor: (jobData: JobData, matchResult: EnhancedMatchResponse) => void
}

export function NewMatchDialog({
  open,
  onOpenChange,
  resumeContent,
  historyItemId,
  onMatchComplete,
  onRetailor,
}: NewMatchDialogProps) {
  const { addNotification: _addNotification } = useNotifications()
  void _addNotification // suppress unused warning
  const [jobDescription, setJobDescription] = useState('')
  const [isJobDescriptionLink, setIsJobDescriptionLink] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [matchResult, setMatchResult] = useState<EnhancedMatchResponse | null>(null)
  const [parsedJob, setParsedJob] = useState<JobData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const handleCheckMatch = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    setIsChecking(true)
    setError(null)
    setMatchResult(null)

    try {
      // Parse job description
      const job = await resumeService.parseJobDescription(jobDescription, isJobDescriptionLink)
      setParsedJob(job)

      // Run match analysis
      const result = await resumeService.matchResume(resumeContent as ParsedResume, job)
      setMatchResult(result)

      // Save match results and job data to history if we have a history item
      if (historyItemId) {
        const matchResults: MatchResults = {
          match_percentage: result.match_percentage,
          // Convert enhanced strengths to legacy string array
          strengths: result.strengths.map(s => s.description),
          // Convert enhanced gaps to legacy string array
          gaps: result.gaps.map(g => g.description),
          recommendations: result.recommendations,
          matched_at: new Date().toISOString(),
          // Store enhanced data
          score_breakdown: result.score_breakdown,
          experience_analysis: result.experience_analysis,
          education_analysis: result.education_analysis,
          strengths_detailed: result.strengths,
          gaps_detailed: result.gaps,
        }

        await updateHistoryItem(historyItemId, {
          match_results: matchResults,
          job_json: job,
        })
      }
    } catch (err) {
      console.error('Match analysis failed:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsChecking(false)
    }
  }

  const handleApplySuggestions = () => {
    if (matchResult && parsedJob) {
      const matchResults: MatchResults = {
        match_percentage: matchResult.match_percentage,
        // Convert enhanced strengths to legacy string array
        strengths: matchResult.strengths.map(s => s.description),
        // Convert enhanced gaps to legacy string array
        gaps: matchResult.gaps.map(g => g.description),
        recommendations: matchResult.recommendations,
        matched_at: new Date().toISOString(),
        // Store enhanced data
        score_breakdown: matchResult.score_breakdown,
        experience_analysis: matchResult.experience_analysis,
        education_analysis: matchResult.education_analysis,
        strengths_detailed: matchResult.strengths,
        gaps_detailed: matchResult.gaps,
      }
      onMatchComplete(matchResults, parsedJob)
      handleClose()
    }
  }

  const handleRetailor = () => {
    if (matchResult && parsedJob) {
      onRetailor(parsedJob, matchResult)
      handleClose()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after a delay to allow animation
    setTimeout(() => {
      setJobDescription('')
      setIsJobDescriptionLink(false)
      setMatchResult(null)
      setParsedJob(null)
      setError(null)
    }, 300)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="New Match Analysis"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {!matchResult ? (
          <>
            {/* Job Description Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="job-description">Job Description</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsJobDescriptionLink(false)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                      !isJobDescriptionLink
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    <Type className="h-3 w-3" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsJobDescriptionLink(true)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                      isJobDescriptionLink
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    <Link className="h-3 w-3" />
                    URL
                  </button>
                </div>
              </div>
              <Textarea
                id="job-description"
                placeholder={isJobDescriptionLink ? "Paste the job posting URL..." : "Paste the job description here..."}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCheckMatch} disabled={isChecking || !jobDescription.trim()}>
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Check Match
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Match Results */}
            <div className="space-y-4">
              {/* Match Score */}
              <div className={`rounded-lg p-4 ${getMatchBgColor(matchResult.match_percentage)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score</span>
                  <span className={`text-3xl font-bold ${getMatchColor(matchResult.match_percentage)}`}>
                    {matchResult.match_percentage}%
                  </span>
                </div>
                {parsedJob && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {parsedJob.title} at {parsedJob.company}
                  </div>
                )}
              </div>

              {/* Score Breakdown Panel */}
              {matchResult.score_breakdown && (
                <ScoreBreakdownPanel breakdown={matchResult.score_breakdown} />
              )}

              <div className="max-h-60 overflow-y-auto space-y-3">
                {/* Strengths */}
                {matchResult.strengths.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Strengths ({matchResult.strengths.length})
                    </div>
                    <div className="space-y-2">
                      {matchResult.strengths.slice(0, 3).map((strength, idx) => (
                        <StrengthCard key={idx} strength={strength} compact />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps - sorted by severity */}
                {matchResult.gaps.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                      Gaps ({matchResult.gaps.length})
                      {matchResult.gaps.filter(g => g.severity === 'critical').length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          {matchResult.gaps.filter(g => g.severity === 'critical').length} critical
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {/* Sort gaps by severity: critical first, then important, then nice_to_have */}
                      {[...matchResult.gaps]
                        .sort((a, b) => {
                          const order = { critical: 0, important: 1, nice_to_have: 2 }
                          return order[a.severity] - order[b.severity]
                        })
                        .slice(0, 4)
                        .map((gap, idx) => (
                          <GapCard key={idx} gap={gap} compact />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => {
                  setMatchResult(null)
                  setParsedJob(null)
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Match
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleApplySuggestions}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Apply Suggestions
                </Button>
                <Button onClick={handleRetailor}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Retailor Resume
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
