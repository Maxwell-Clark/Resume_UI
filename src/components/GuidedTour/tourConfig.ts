import type { TourId } from '@/contexts/TourContext'

export interface TourStep {
  target: string // data-tour attribute selector
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export const tourSteps: Record<TourId, TourStep[]> = {
  studio: [
    {
      target: 'resume-selection',
      title: 'Select Your Resume',
      content: 'Choose from your library or upload a new PDF to get started.',
      placement: 'bottom',
    },
    {
      target: 'job-input-toggle',
      title: 'Job Description Input',
      content: 'Enter the job description as text or paste a URL to automatically scrape it.',
      placement: 'bottom',
    },
    {
      target: 'check-match-button',
      title: 'Analyze Match',
      content: 'Click here to see how well your resume matches the job requirements.',
      placement: 'center',
    },
    {
      target: 'match-score',
      title: 'Match Score',
      content: '80%+ is excellent, 60-79% is good, below 60% needs improvement.',
      placement: 'left',
    },
    {
      target: 'strengths-section',
      title: 'Your Strengths',
      content: 'These are skills and experiences that align well with the job.',
      placement: 'left',
    },
    {
      target: 'gaps-section',
      title: 'Areas to Address',
      content: 'Requirements you may be missing - tailoring can help address these.',
      placement: 'left',
    },
    {
      target: 'tailor-prompt',
      title: 'Customize Tailoring',
      content: 'Add specific instructions to guide how AI tailors your resume.',
      placement: 'top',
    },
    {
      target: 'tailor-button',
      title: 'Tailor Resume',
      content: 'Standard tailoring using your prompt and the job description.',
      placement: 'top',
    },
    {
      target: 'tailor-with-suggestions-button',
      title: 'Enhanced Tailoring',
      content: 'Tailoring that specifically addresses the identified gaps.',
      placement: 'top',
    },
  ],
  history: [
    {
      target: 'status-dropdown',
      title: 'Track Your Progress',
      content: 'Update status as you progress: Tailored → Applied → Interviewing → Result',
      placement: 'bottom',
    },
    {
      target: 'editable-field',
      title: 'Click to Edit',
      content: 'Job title and company fields are editable - just click to update.',
      placement: 'bottom',
    },
    {
      target: 'favorite-star',
      title: 'Pin Important Items',
      content: 'Star applications to keep them pinned at the top of your list.',
      placement: 'left',
    },
  ],
  editor: [
    {
      target: 'ai-edit-button',
      title: 'AI Assistance',
      content: 'Use AI to improve any text section - makes editing faster and smarter.',
      placement: 'bottom',
    },
    {
      target: 'summary-field',
      title: 'Professional Summary',
      content: 'Write 2-3 sentences highlighting your key qualifications.',
      placement: 'bottom',
    },
    {
      target: 'save-button',
      title: 'Save Changes',
      content: 'Save your edits and regenerate the PDF preview.',
      placement: 'left',
    },
    {
      target: 'quick-rematch-button',
      title: 'Quick Rematch',
      content: 'Re-analyze your edited resume against the same job description.',
      placement: 'left',
    },
  ],
}

export function getTourSteps(tourId: TourId): TourStep[] {
  return tourSteps[tourId] || []
}
