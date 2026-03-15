import posthog from 'posthog-js'

export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    posthog.capture(event, properties)
  },

  // Pre-defined events
  resumeCreated: (resumeId: string) =>
    posthog.capture('resume_created', { resume_id: resumeId }),

  resumeTailored: (resumeId: string, matchScore: number) =>
    posthog.capture('resume_tailored', { resume_id: resumeId, match_score: matchScore }),

  jobParsed: (source: 'url' | 'text') =>
    posthog.capture('job_parsed', { source }),

  matchAnalysisRun: (matchScore: number) =>
    posthog.capture('match_analysis_run', { match_score: matchScore }),
}
