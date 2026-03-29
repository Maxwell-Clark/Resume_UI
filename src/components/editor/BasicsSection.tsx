import { User, HelpCircle, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tooltip } from '@/components/ui/tooltip'
import { ProButton } from '@/components/ProFeatureGate'
import { SectionWrapper } from './SectionWrapper'

interface BasicsSectionProps {
  basics: {
    name: string
    label: string
    email: string
    phone: string
    summary: string
    location: string
    website: string
  }
  setBasics: (basics: BasicsSectionProps['basics']) => void
  expanded: boolean
  onToggle: () => void
  onAIEdit: (type: 'basics_summary' | 'work_summary' | 'work_highlight' | 'education_detail' | 'project_description' | 'project_highlight', fieldLabel: string, currentText: string, workIndex?: number, highlightIndex?: number, educationIndex?: number, detailIndex?: number, projectIndex?: number) => void
  templateHint?: string | null
}

export function BasicsSection({
  basics,
  setBasics,
  expanded,
  onToggle,
  onAIEdit,
  templateHint,
}: BasicsSectionProps) {
  const update = (field: keyof typeof basics, value: string) => {
    setBasics({ ...basics, [field]: value })
  }

  return (
    <SectionWrapper
      icon={<User className="h-5 w-5 text-blue-600" />}
      title="Personal Information"
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {templateHint && (
          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            {templateHint}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={basics.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label>Professional Title</Label>
            <Input
              value={basics.label}
              onChange={(e) => update('label', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={basics.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={basics.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={basics.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="City, State"
            />
          </div>
          <div>
            <Label>Website / LinkedIn</Label>
            <Input
              value={basics.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
        </div>

        <div data-tour="summary-field">
          <div className="flex items-center gap-2 mb-1">
            <Label>Professional Summary</Label>
            <Tooltip content="2-3 sentences of key qualifications">
              <HelpCircle className="h-4 w-4 text-slate-400" />
            </Tooltip>
          </div>
          <Textarea
            value={basics.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="Brief professional summary highlighting your key qualifications..."
            rows={4}
          />
          <div className="mt-2 flex justify-end" data-tour="ai-edit-button">
            <ProButton
              size="sm"
              variant="outline"
              onClick={() => onAIEdit('basics_summary', 'Professional Summary', basics.summary)}
              featureName="AI Edit"
            >
              <Sparkles className="h-4 w-4" />
              AI Edit
            </ProButton>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
