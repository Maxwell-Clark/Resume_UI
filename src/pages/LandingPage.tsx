import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { PublicLayout } from '@/components/PublicLayout'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Link as LinkIcon,
  History,
  Upload,
  CheckCircle,
  Shield,
  Target,
  Wand2,
  Download,
  Edit,
  ThumbsUp,
  AlertTriangle,
  Clock
} from 'lucide-react'

export function LandingPage() {
  const { user, loading } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/studio')
    } else {
      openAuthModal('signup')
    }
  }

  const handleSignIn = () => {
    openAuthModal('login')
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
                Land More Interviews with
                <span className="text-blue-600 dark:text-blue-400"> Perfectly Matched Resumes</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                See exactly how your resume matches each job. Get personalized recommendations, then tailor in one click.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={handleGetStarted}
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
                {!user && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </Button>
                )}
              </div>
              {/* Mini feature badges */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Match Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>One-Click Tailoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>ATS-Optimized</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">30s</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">Average processing time</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">Better</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">Match improvement with every tailor</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">ATS-Ready</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">Resumes formatted for tracking systems</p>
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
                Get a perfectly tailored resume in four simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Upload or Create</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload your existing resume or build one from scratch using our editor.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="h-8 w-8 text-white" />
                </div>
                <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Paste the Job</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Paste a URL or job description text. We automatically extract the key details.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">See Your Match Score</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get a percentage score plus detailed strengths, gaps, and personalized recommendations.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold">
                  4
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Tailor & Download</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Apply recommendations with one click, then download your optimized PDF.
                </p>
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
                Everything you need to land more interviews
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Match Analysis</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  See your percentage match score, key strengths, and gaps at a glance.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Wand2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">One-Click Tailoring</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Apply AI recommendations automatically to optimize your resume for each job.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <LinkIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Paste URL or Text</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Just paste a job posting URL or text. We extract the requirements automatically.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Version History</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Track every resume version. Access and download any previous tailored resume.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Instant PDF</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Download professional, ATS-ready PDFs instantly after tailoring.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Edit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Full Resume Editor</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Edit every section of your resume directly in the app with our intuitive editor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Match Analysis Showcase */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">See How You Match</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Our unique match analysis shows exactly where you stand and how to improve
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">78%</span>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">Match Score</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Your Strengths</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>5+ years relevant experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Strong technical skills match</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Leadership experience highlighted</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Gaps to Address</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Missing keyword: "cross-functional"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Add more quantified achievements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Emphasize project management</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-center">
                <Button size="lg" onClick={handleGetStarted}>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Tailor to Address Gaps
                </Button>
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
              Start tailoring your resume today and see how you match with any job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={handleGetStarted}
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Link to="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
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
                      <li><button onClick={() => openAuthModal('signup')} className="hover:text-white transition-colors">Sign Up</button></li>
                      <li><button onClick={() => openAuthModal('login')} className="hover:text-white transition-colors">Sign In</button></li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-slate-400">
                  <li>Match Analysis</li>
                  <li>One-Click Tailoring</li>
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
