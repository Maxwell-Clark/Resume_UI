export interface ResumeTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnail: string
  isPro: boolean
  tags: string[]
}

export type TemplateCategory = 'professional' | 'modern' | 'minimal'

export const TEMPLATE_CATEGORIES: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'professional', label: 'Professional' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
]
