import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ResumeTemplate } from '@/types/template'
import { TEMPLATES } from '@/data/templates'

interface TemplateContextType {
  selectedTemplateId: string
  setSelectedTemplateId: (id: string) => void
  selectedTemplate: ResumeTemplate
  primaryColor: string
  secondaryColor: string
  setPrimaryColor: (color: string) => void
  setSecondaryColor: (color: string) => void
  resetColors: () => void
}

const DEFAULT_TEMPLATE_ID = 'classic'

function getTemplate(id: string): ResumeTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined)

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [selectedTemplateId, setSelectedTemplateIdRaw] = useState<string>(() => {
    const stored = localStorage.getItem('selected_template')
    if (stored && TEMPLATES.some((t) => t.id === stored)) {
      return stored
    }
    return DEFAULT_TEMPLATE_ID
  })

  const [primaryColor, setPrimaryColorRaw] = useState<string>(() => {
    return localStorage.getItem('template_primary_color') || getTemplate(
      localStorage.getItem('selected_template') || DEFAULT_TEMPLATE_ID
    ).defaultPrimary
  })

  const [secondaryColor, setSecondaryColorRaw] = useState<string>(() => {
    return localStorage.getItem('template_secondary_color') || getTemplate(
      localStorage.getItem('selected_template') || DEFAULT_TEMPLATE_ID
    ).defaultSecondary
  })

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorRaw(color)
    localStorage.setItem('template_primary_color', color)
  }, [])

  const setSecondaryColor = useCallback((color: string) => {
    setSecondaryColorRaw(color)
    localStorage.setItem('template_secondary_color', color)
  }, [])

  const handleSetTemplate = useCallback((id: string) => {
    setSelectedTemplateIdRaw(id)
    localStorage.setItem('selected_template', id)

    // Reset colors to the new template's defaults
    const template = getTemplate(id)
    setPrimaryColorRaw(template.defaultPrimary)
    setSecondaryColorRaw(template.defaultSecondary)
    localStorage.setItem('template_primary_color', template.defaultPrimary)
    localStorage.setItem('template_secondary_color', template.defaultSecondary)
  }, [])

  const resetColors = useCallback(() => {
    const template = getTemplate(selectedTemplateId)
    setPrimaryColor(template.defaultPrimary)
    setSecondaryColor(template.defaultSecondary)
  }, [selectedTemplateId, setPrimaryColor, setSecondaryColor])

  const selectedTemplate = getTemplate(selectedTemplateId)

  return (
    <TemplateContext.Provider
      value={{
        selectedTemplateId,
        setSelectedTemplateId: handleSetTemplate,
        selectedTemplate,
        primaryColor,
        secondaryColor,
        setPrimaryColor,
        setSecondaryColor,
        resetColors,
      }}
    >
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplate() {
  const context = useContext(TemplateContext)
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider')
  }
  return context
}
