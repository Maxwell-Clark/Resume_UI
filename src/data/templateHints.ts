/**
 * Template-specific contextual hints shown in editor sections.
 * These help users understand how their data will be rendered
 * differently depending on the selected template.
 */

type SectionHints = {
  basics?: string
  skills?: string
  education?: string
  work?: string
  certifications?: string
}

const TEMPLATE_HINTS: Record<string, SectionHints> = {
  classic: {
    basics: 'Classic template displays your professional title below your name in the header.',
  },
  modern: {
    basics: 'Modern template centers your professional title and uses teal accent colors for section headings.',
  },
  minimal: {
    basics: 'Minimal template uses a clean black-and-white layout optimized for ATS systems.',
  },
  executive: {
    basics: 'Executive template uses a spacious two-column header with your professional title prominently displayed.',
  },
  professional: {
    basics: 'Professional template centers your name and shows a pipe-separated contact line including LinkedIn.',
    skills: 'This template automatically splits skills into "Soft Skills" and "Technical Skills." Name a category with words like "soft," "leadership," or "communication" to classify it as soft skills.',
    education: 'With multiple entries, this template renders education in a compact two-column layout.',
    certifications: 'With multiple entries, this template renders certifications in a compact two-column layout.',
  },
}

export function getTemplateHints(templateId: string): SectionHints {
  return TEMPLATE_HINTS[templateId] ?? {}
}
