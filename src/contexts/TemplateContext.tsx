import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ResumeTemplate } from '@/types/template'
import { TEMPLATES } from '@/data/templates'

interface TemplateContextType {
  selectedTemplateId: string
  setSelectedTemplateId: (id: string) => void
  selectedTemplate: ResumeTemplate
}

const DEFAULT_TEMPLATE_ID = 'classic'

const TemplateContext = createContext<TemplateContextType | undefined>(undefined)

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const stored = localStorage.getItem('selected_template')
    if (stored && TEMPLATES.some((t) => t.id === stored)) {
      return stored
    }
    return DEFAULT_TEMPLATE_ID
  })

  const handleSetTemplate = (id: string) => {
    setSelectedTemplateId(id)
    localStorage.setItem('selected_template', id)
  }

  const selectedTemplate =
    TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0]

  return (
    <TemplateContext.Provider
      value={{
        selectedTemplateId,
        setSelectedTemplateId: handleSetTemplate,
        selectedTemplate,
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
