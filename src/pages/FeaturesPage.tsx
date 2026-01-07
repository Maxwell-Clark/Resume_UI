import { PublicLayout } from '@/components/PublicLayout'
import { 
  Sparkles, 
  Link as LinkIcon, 
  FileText, 
  History, 
  Shield, 
  Zap,
  Globe,
  CheckCircle,
  FileCheck,
  Settings,
  Download
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function FeaturesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/tailor')
    } else {
      navigate('/signup')
    }
  }

  const mainFeatures = [
    {
      icon: <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: 'AI-Powered Tailoring',
      description: 'Our advanced Gemini AI analyzes job descriptions and optimizes your resume to match requirements perfectly. The AI understands context, identifies key skills, and rephrases your experience to highlight relevant qualifications.',
      benefits: [
        'Context-aware analysis of job requirements',
        'Intelligent keyword matching',
        'Industry-specific optimization',
        'Maintains factual accuracy',
      ],
    },
    {
      icon: <LinkIcon className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: 'Smart Job Parsing',
      description: 'Simply paste a job posting URL or text, and our AI extracts all critical information including requirements, responsibilities, qualifications, and preferred skills.',
      benefits: [
        'Automatic web scraping from job URLs',
        'Extracts key requirements and skills',
        'Identifies job title, company, and location',
        'Understands structured and unstructured formats',
      ],
    },
    {
      icon: <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
      title: 'Customizable Prompts',
      description: 'Fine-tune how the AI tailors your resume with custom prompts. Adjust emphasis on technical skills, leadership experience, or industry-specific requirements.',
      benefits: [
        'Full control over AI behavior',
        'Save and reuse custom prompts',
        'Optimize for specific industries',
        'Pro and Enterprise feature',
      ],
    },
    {
      icon: <History className="h-8 w-8 text-orange-600 dark:text-orange-400" />,
      title: 'Resume History',
      description: 'Track all your tailored resumes in one place. Access, download, or compare different versions. Never lose track of which resume you used for which application.',
      benefits: [
        'Complete history of all tailored resumes',
        'Easy search and filtering',
        'Download previous versions',
        'Track application status',
      ],
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />,
      title: 'Secure Cloud Storage',
      description: 'Your resumes are stored securely in Supabase cloud storage with encryption at rest. Access your files from anywhere, anytime.',
      benefits: [
        'Encrypted storage',
        'Automatic backups',
        'Access from any device',
        'GDPR compliant',
      ],
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
      title: 'Fast Processing',
      description: 'Get your tailored resume in seconds, not minutes. Our optimized AI pipeline processes resumes quickly without compromising quality.',
      benefits: [
        '30-60 second processing time',
        'Real-time status updates',
        'Background processing support',
        'No queue waiting',
      ],
    },
  ]

  const additionalFeatures = [
    {
      icon: <Globe className="h-5 w-5" />,
      text: 'Industry-agnostic - works for any field',
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      text: 'ATS-optimized formatting',
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      text: 'Multiple export formats (PDF, LaTeX, JSON)',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      text: 'Customizable output filename',
    },
    {
      icon: <Download className="h-5 w-5" />,
      text: 'Instant download after processing',
    },
  ]

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Powerful Features for Modern Job Seekers
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            Everything you need to create the perfect resume for every job application.
            Powered by cutting-edge AI technology.
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            {user ? 'Go to Dashboard' : 'Get Started Free'}
          </Button>
        </div>

        <div className="space-y-16 mb-16">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">
            Additional Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="text-blue-600 dark:text-blue-400">{feature.icon}</div>
                <span className="text-slate-700 dark:text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Start tailoring your resume today and see the difference AI can make.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}













