import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PublicLayout } from '@/components/PublicLayout'
import { Button } from '@/components/ui/button'
import { 
  FileText,
  Sparkles, 
  Link as LinkIcon, 
  History, 
  Upload, 
  CheckCircle, 
  Shield,
  Zap,
  Globe,
  FileCheck
} from 'lucide-react'

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/tailor')
    } else {
      navigate('/signup')
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto">

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Tailor Your Resume to
              <span className="text-blue-600 dark:text-blue-400"> Every Job</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              AI-powered resume tailoring that adapts your experience to match any job description. 
              Get ATS-optimized resumes in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleGetStarted}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              {!user && (
                <Link to="/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

        {/* Features Section */}
        <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to create the perfect resume for every job application
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">AI-Powered Tailoring</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced AI analyzes job descriptions and optimizes your resume to match requirements perfectly.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <LinkIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Smart Job Parsing</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Paste a job URL or description text. Our AI extracts key requirements automatically.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Customizable Prompts</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Fine-tune the AI's approach with custom prompts or use our optimized defaults.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Resume History</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Track all your tailored resumes. Access and download them anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* How It Works Section */}
        <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get a tailored resume in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                1
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Upload Your Resume</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Upload your resume in PDF format. Our system extracts and analyzes all your experience, skills, and qualifications.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <LinkIcon className="h-8 w-8 text-white" />
              </div>
              <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                2
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Add Job Description</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Provide the job description as a URL link or paste the text directly. Our AI parses and understands the requirements.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                3
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Get Tailored Resume</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Receive your perfectly tailored resume optimized for ATS systems. Download as PDF instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Benefits Section */}
        <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Why Choose AAA Resume?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Professional resume tailoring powered by cutting-edge AI
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">ATS-Optimized</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Resumes formatted to pass applicant tracking systems</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Industry-Agnostic</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Works for any field, from tech to healthcare to finance</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <FileCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Professional PDF</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">High-quality PDF output ready for applications</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Secure Storage</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your resumes stored securely in the cloud</p>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg my-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start tailoring your resume today and see the difference AI can make.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={handleGetStarted}
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
          </Button>
        </div>
      </section>

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 py-12 rounded-lg mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-xl font-bold text-white">AAA Resume</span>
              </div>
              <p className="text-slate-400">
                AI-powered resume tailoring for every job application.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {user ? (
                  <>
                    <li><Link to="/tailor" className="hover:text-white transition-colors">Dashboard</Link></li>
                    <li><Link to="/history" className="hover:text-white transition-colors">History</Link></li>
                    <li><Link to="/account" className="hover:text-white transition-colors">Account</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                    <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-slate-400">
                <li>AI-Powered Tailoring</li>
                <li>Job Description Parsing</li>
                <li>Resume History</li>
                <li>Secure Storage</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 dark:border-slate-700 pt-8 text-center text-slate-400 dark:text-slate-500">
            <p>&copy; {new Date().getFullYear()} AAA Resume. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </PublicLayout>
  )
}

