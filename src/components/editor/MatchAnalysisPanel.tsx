import {
  Loader2,
  Plus,
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Wand2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import { ProButton } from '@/components/ProFeatureGate'
import { Tooltip } from '@/components/ui/tooltip'
import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel'
import { StrengthCard } from '@/components/StrengthCard'
import { GapCard } from '@/components/GapCard'
import { ScoreComparisonCard } from '@/components/ScoreComparisonCard'
import { type HistoryItem, getCriticalGapsCount } from '@/lib/history'
import { type JobData, type GuaranteedTailorResponse } from '@/services/resume'

export interface MatchSectionsExpanded {
  scoreBreakdown: boolean
  keywordAnalysis: boolean
  strengths: boolean
  gaps: boolean
  recommendations: boolean
}

interface MatchAnalysisPanelProps {
  historyItem: HistoryItem | null
  matchSectionsExpanded: MatchSectionsExpanded
  toggleMatchSection: (section: 'scoreBreakdown' | 'keywordAnalysis' | 'strengths' | 'gaps' | 'recommendations') => void
  onNewMatch: () => void
  onRetailor: () => void
  onRematch: () => void
  isRetailoring: boolean
  isRematching: boolean
  currentJobData: JobData | null
  lastGuaranteedResult: GuaranteedTailorResponse | null
  getMatchColor: (percentage: number) => string
  getMatchBgColor: (percentage: number) => string
}

export function MatchAnalysisPanel({
  historyItem,
  matchSectionsExpanded,
  toggleMatchSection,
  onNewMatch,
  onRetailor,
  onRematch,
  isRetailoring,
  isRematching,
  currentJobData,
  lastGuaranteedResult,
  getMatchColor,
  getMatchBgColor,
}: MatchAnalysisPanelProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Match History</h3>
        </div>
        <ProButton
          variant="outline"
          size="sm"
          onClick={onNewMatch}
          disabled={isRetailoring}
          featureName="Job Match Analysis"
          featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </ProButton>
      </div>

      {historyItem?.match_results ? (
        <div className="space-y-4">
          {/* Match Score */}
          <div className={`rounded-lg p-4 ${getMatchBgColor(historyItem.match_results.match_percentage)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Match Score</span>
              <span className={`text-2xl font-bold ${getMatchColor(historyItem.match_results.match_percentage)}`}>
                {historyItem.match_results.match_percentage}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Matched {new Date(historyItem.match_results.matched_at).toLocaleDateString()} at{' '}
                {new Date(historyItem.match_results.matched_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {getCriticalGapsCount(historyItem.match_results) > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                  {getCriticalGapsCount(historyItem.match_results)} critical
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <ProButton
              size="sm"
              className="w-full"
              disabled={isRetailoring || (!historyItem?.job_json && !currentJobData)}
              onClick={onRetailor}
              featureName="Resume Tailoring"
              featureDescription="Automatically tailor your resume to match the job description. AI-powered optimization for better results."
            >
              {isRetailoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tailoring...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Retailor Resume
                </>
              )}
            </ProButton>
            {historyItem?.job_json && (
              <div data-tour="quick-rematch-button">
                <Tooltip content="Re-analyze with same job description">
                  <ProButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isRematching || isRetailoring}
                    onClick={onRematch}
                    featureName="Rematch Analysis"
                    featureDescription="Re-analyze your resume against the same job. See how your changes improved your match score."
                  >
                    {isRematching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rematching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rematch
                      </>
                    )}
                  </ProButton>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Score Comparison Card */}
          {lastGuaranteedResult && (
            <ScoreComparisonCard
              baselineScore={lastGuaranteedResult.baseline_score}
              finalScore={lastGuaranteedResult.final_score}
              scoreImprovement={lastGuaranteedResult.score_improvement}
              attempts={lastGuaranteedResult.attempts}
              verificationPassed={lastGuaranteedResult.verification_passed}
              warnings={lastGuaranteedResult.warnings}
            />
          )}

          {/* Score Breakdown Panel */}
          {historyItem.match_results.score_breakdown && (
            <ScoreBreakdownPanel breakdown={historyItem.match_results.score_breakdown} />
          )}

          {/* Strengths */}
          {historyItem.match_results.strengths.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleMatchSection('strengths')}
                className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors w-full text-left"
              >
                {matchSectionsExpanded.strengths ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Strengths</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({historyItem.match_results.strengths.length})
                </span>
              </button>
              {matchSectionsExpanded.strengths && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {historyItem.match_results.strengths_detailed ? (
                    historyItem.match_results.strengths_detailed.map((strength, idx) => (
                      <StrengthCard key={idx} strength={strength} compact />
                    ))
                  ) : (
                    <ul className="space-y-1.5 pl-6">
                      {historyItem.match_results.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Gaps */}
          {historyItem.match_results.gaps.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => toggleMatchSection('gaps')}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full text-left"
              >
                {matchSectionsExpanded.gaps ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">Gaps</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({historyItem.match_results.gaps.length})
                </span>
                {getCriticalGapsCount(historyItem.match_results) > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ml-auto">
                    {getCriticalGapsCount(historyItem.match_results)} critical
                  </span>
                )}
              </button>
              {matchSectionsExpanded.gaps && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {historyItem.match_results.gaps_detailed ? (
                    [...historyItem.match_results.gaps_detailed]
                      .sort((a, b) => {
                        const order = { critical: 0, important: 1, nice_to_have: 2 }
                        return order[a.severity] - order[b.severity]
                      })
                      .map((gap, idx) => <GapCard key={idx} gap={gap} compact />)
                  ) : (
                    <ul className="space-y-1.5 pl-6">
                      {historyItem.match_results.gaps.map((gap, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {historyItem.match_results.recommendations &&
            historyItem.match_results.recommendations.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => toggleMatchSection('recommendations')}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors w-full text-left"
                >
                  {matchSectionsExpanded.recommendations ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-semibold">Recommendations</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ({historyItem.match_results.recommendations.length})
                  </span>
                </button>
                {matchSectionsExpanded.recommendations && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <ul className="space-y-1.5 pl-6">
                      {historyItem.match_results.recommendations.map((recommendation, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 list-disc">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No match analysis yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Run a match analysis to see strengths, gaps, and recommendations.
          </p>
          <ProButton
            variant="outline"
            size="sm"
            onClick={onNewMatch}
            disabled={isRetailoring}
            featureName="Job Match Analysis"
            featureDescription="Analyze how well your resume matches a job description. Get insights on what to improve."
          >
            <Target className="h-4 w-4 mr-2" /> Start New Match
          </ProButton>
        </div>
      )}
    </>
  )
}
