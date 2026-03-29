import type { ResumeTemplate } from '@/types/template'

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Navy blue headers, Palatino font, professional layout.',
    category: 'professional',
    thumbnail: '/templates/classic.svg',
    isPro: false,
    tags: ['ats-friendly', 'single-column', 'serif'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif design with teal accent colors.',
    category: 'modern',
    thumbnail: '/templates/modern.svg',
    isPro: false,
    tags: ['sans-serif', 'color-accent', 'clean'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Black and white, no frills, maximum readability.',
    category: 'minimal',
    thumbnail: '/templates/minimal.svg',
    isPro: false,
    tags: ['minimal', 'whitespace', 'no-color'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Conservative serif layout with generous whitespace.',
    category: 'professional',
    thumbnail: '/templates/executive.svg',
    isPro: true,
    tags: ['ats-friendly', 'single-column', 'serif', 'formal'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Centered header, two-column education and certifications.',
    category: 'professional',
    thumbnail: '/templates/professional.svg',
    isPro: true,
    tags: ['two-column', 'centered', 'structured'],
  },
]
