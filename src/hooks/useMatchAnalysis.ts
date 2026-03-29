import { useState, useCallback } from 'react'
import { resumeService, generateRetailorPrompt, type ParsedResume, type JobData, type EnhancedMatchResponse, type GuaranteedTailorResponse } from '@/services/resume'
import { updateHistoryItem, getHistoryItemById, type HistoryItem, type MatchResults } from '@/lib/history'
import { useNotifications } from '@/contexts/NotificationContext'
import type { MatchSectionsExpanded } from '@/components/editor/MatchAnalysisPanel'

export interface UseMatchAnalysisReturn {
  newMatchDialogOpen: boolean
  setNewMatchDialogOpen: (open: boolean) => void
  currentJobData: JobData | null
  currentMatchResult: EnhancedMatchResponse | null
  isRetailoring: boolean
  lastGuaranteedResult: GuaranteedTailorResponse | null
  isRematching: boolean
  enhancingHighlight: { workIndex: number; highlightIndex: number } | null
  setEnhancingHighlight: (v: { workIndex: number; highlightIndex: number } | null) => void
  matchPanelOpen: boolean
  setMatchPanelOpen: (open: boolean) => void
  matchSectionsExpanded: MatchSectionsExpanded
  toggleMatchSection: (section: 'scoreBreakdown' | 'keywordAnalysis' | 'strengths' | 'gaps' | 'recommendations') => void
  handleMatchComplete: (results: MatchResults, jobData: JobData) => void
  handleRetailor: (jobData?: JobData, matchResult?: EnhancedMatchResponse) => Promise<void>
  handleQuickRematch: () => Promise<void>
  getMatchColor: (percentage: number) => string
  getMatchBgColor: (percentage: number) => string
}

interface UseMatchAnalysisOptions {
  historyItem: HistoryItem | null
  setHistoryItem: (item: HistoryItem | null) => void
  resume: { content?: unknown } | null
  buildResumeContent: () => ParsedResume
  resumeName: string
  selectedTemplateId: string
}

export function useMatchAnalysis({
  historyItem,
  setHistoryItem,
  resume,
  buildResumeContent,
  resumeName,
  selectedTemplateId,
}: UseMatchAnalysisOptions): UseMatchAnalysisReturn {
  const { addNotification } = useNotifications()

  const [newMatchDialogOpen, setNewMatchDialogOpen] = useState(false)
  const [currentJobData, setCurrentJobData] = useState<JobData | null>(null)
  const [currentMatchResult, setCurrentMatchResult] = useState<EnhancedMatchResponse | null>(null)
  const [isRetailoring, setIsRetailoring] = useState(false)
  const [lastGuaranteedResult, setLastGuaranteedResult] = useState<GuaranteedTailorResponse | null>(null)
  const [isRematching, setIsRematching] = useState(false)
  const [enhancingHighlight, setEnhancingHighlight] = useState<{ workIndex: number; highlightIndex: number } | null>(null)

  const [matchPanelOpen, setMatchPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })

  const [matchSectionsExpanded, setMatchSectionsExpanded] = useState<MatchSectionsExpanded>({
    scoreBreakdown: false,
    keywordAnalysis: false,
    strengths: true,
    gaps: true,
    recommendations: true,
  })

  const toggleMatchSection = useCallback((section: 'scoreBreakdown' | 'keywordAnalysis' | 'strengths' | 'gaps' | 'recommendations') => {
    setMatchSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const handleMatchComplete = useCallback((results: MatchResults, jobData: JobData) => {
    if (historyItem) {
      setHistoryItem({ ...historyItem, match_results: results })
    }
    setCurrentJobData(jobData)
    if (results.strengths_detailed && results.gaps_detailed && results.score_breakdown) {
      setCurrentMatchResult({
        match_percentage: results.match_percentage,
        score_breakdown: results.score_breakdown,
        experience_analysis: results.experience_analysis!,
        education_analysis: results.education_analysis!,
        strengths: results.strengths_detailed,
        gaps: results.gaps_detailed,
        recommendations: results.recommendations,
      })
    } else {
      setCurrentMatchResult(null)
    }
    addNotification({
      title: 'Match Analysis Complete',
      message: `Your resume achieved a ${results.match_percentage}% match score.`,
      type: 'success'
    })
  }, [historyItem, setHistoryItem, addNotification])

  const handleRetailor = useCallback(async (jobData?: JobData, matchResult?: EnhancedMatchResponse) => {
    const job = jobData || currentJobData || (historyItem?.job_json as JobData | undefined)
    const historyMatch = historyItem?.match_results
    const match = matchResult || currentMatchResult || (historyMatch ? {
      match_percentage: historyMatch.match_percentage,
      strengths: historyMatch.strengths_detailed || historyMatch.strengths.map(s => ({ description: s, confidence: 80, evidence: [], category: 'general' })),
      gaps: historyMatch.gaps_detailed || historyMatch.gaps.map(g => ({ description: g, severity: 'important' as const, category: 'general', recommendation: '' })),
      recommendations: historyMatch.recommendations,
      score_breakdown: historyMatch.score_breakdown || { overall: historyMatch.match_percentage, skills_match: 0, experience_match: 0, education_match: 0, ats_compatibility: 0, ai_role_fit: 0 },
      experience_analysis: historyMatch.experience_analysis || { years_required: null, years_found: 0, relevance_score: 0, seniority_match: 'match' as const, relevant_roles: [] },
      education_analysis: historyMatch.education_analysis || { degree_match: false, field_match: false },
    } : null)

    if (!job || !match) {
      addNotification({ title: 'Cannot Retailor', message: 'Please run a match analysis first to get job data.', type: 'error' })
      return
    }

    setIsRetailoring(true)
    setLastGuaranteedResult(null)

    try {
      const resumeContent = resume?.content || buildResumeContent()
      const prompt = generateRetailorPrompt(match)
      const fileName = `${resumeName || 'Resume'}_Tailored_${Date.now()}`

      const result = await resumeService.tailorResume(
        resumeContent as ParsedResume, job, fileName,
        { historyId: historyItem?.id, customPrompt: prompt, guaranteed: true, baselineMatch: match, maxRetries: 2, templateId: selectedTemplateId }
      ) as GuaranteedTailorResponse

      setLastGuaranteedResult(result)

      const downloadUrl = result.storage?.public_url || result.storage?.url || ''

      if (historyItem) {
        await updateHistoryItem(historyItem.id, { download_url: downloadUrl, status: 'tailored' })
        const refreshedHistory = await getHistoryItemById(historyItem.id)
        if (refreshedHistory) {
          setHistoryItem(refreshedHistory)
        }
      }

      const improvementText = result.score_improvement > 0
        ? `Score improved from ${result.baseline_score}% to ${result.final_score}% (+${result.score_improvement}%)`
        : result.score_improvement === 0
        ? `Score maintained at ${result.final_score}%`
        : `Score: ${result.final_score}% (${result.score_improvement}%)`

      addNotification({
        title: result.verification_passed ? 'Resume Tailored Successfully' : 'Resume Tailored with Warnings',
        message: `${improvementText}. Check the History page to download.`,
        type: result.verification_passed ? 'success' : 'warning'
      })

      const keywordsLost = (result as GuaranteedTailorResponse & { keywords_lost?: string[] }).keywords_lost
      if (keywordsLost && keywordsLost.length > 0) {
        addNotification({
          title: 'Keywords Lost',
          message: `${keywordsLost.length} keyword(s) were lost during tailoring: ${keywordsLost.slice(0, 3).join(', ')}${keywordsLost.length > 3 ? '...' : ''}`,
          type: 'warning'
        })
      }
    } catch (err) {
      console.error('Retailor failed:', err)
      addNotification({ title: 'Retailor Failed', message: err instanceof Error ? err.message : 'An error occurred while tailoring.', type: 'error' })
    } finally {
      setIsRetailoring(false)
    }
  }, [currentJobData, currentMatchResult, historyItem, setHistoryItem, resume, buildResumeContent, resumeName, addNotification, selectedTemplateId])

  const handleQuickRematch = useCallback(async () => {
    const job = historyItem?.job_json as JobData | undefined
    if (!job) {
      addNotification({ title: 'Cannot Rematch', message: 'No saved job data found. Use "New Match" to enter a job description.', type: 'error' })
      return
    }

    setIsRematching(true)
    try {
      const resumeContent = resume?.content || buildResumeContent()
      const result = await resumeService.matchResume(resumeContent as ParsedResume, job)

      const matchResults: MatchResults = {
        match_percentage: result.match_percentage,
        strengths: result.strengths.map(s => s.description),
        gaps: result.gaps.map(g => g.description),
        recommendations: result.recommendations,
        matched_at: new Date().toISOString(),
        score_breakdown: result.score_breakdown,
        experience_analysis: result.experience_analysis,
        education_analysis: result.education_analysis,
        strengths_detailed: result.strengths,
        gaps_detailed: result.gaps,
      }

      if (historyItem) {
        await updateHistoryItem(historyItem.id, { match_results: matchResults })
        setHistoryItem({ ...historyItem, match_results: matchResults })
      }

      setCurrentJobData(job)
      setCurrentMatchResult(result)

      addNotification({ title: 'Match Analysis Complete', message: `Your resume achieved a ${result.match_percentage}% match score.`, type: 'success' })
    } catch (err) {
      console.error('Rematch failed:', err)
      addNotification({ title: 'Rematch Failed', message: err instanceof Error ? err.message : 'An error occurred during match analysis.', type: 'error' })
    } finally {
      setIsRematching(false)
    }
  }, [historyItem, setHistoryItem, resume, buildResumeContent, addNotification])

  const getMatchColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }, [])

  const getMatchBgColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }, [])

  return {
    newMatchDialogOpen, setNewMatchDialogOpen,
    currentJobData, currentMatchResult,
    isRetailoring, lastGuaranteedResult,
    isRematching,
    enhancingHighlight, setEnhancingHighlight,
    matchPanelOpen, setMatchPanelOpen,
    matchSectionsExpanded, toggleMatchSection,
    handleMatchComplete, handleRetailor, handleQuickRematch,
    getMatchColor, getMatchBgColor,
  }
}
