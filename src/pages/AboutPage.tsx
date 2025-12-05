import { PublicLayout } from '@/components/PublicLayout'
import { Sparkles, Shield, Zap, Target } from 'lucide-react'

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            About AAA Resume
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Empowering job seekers with AI-powered resume optimization
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              At AAA Resume, we believe that every job seeker deserves a resume that accurately
              represents their skills and experience while maximizing their chances of landing
              their dream job. We've built an AI-powered platform that makes professional
              resume tailoring accessible to everyone.
            </p>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              Our mission is to level the playing field in job applications by providing
              cutting-edge AI technology that helps candidates present their qualifications
              in the best possible light, without compromising on truthfulness or accuracy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              How We're Different
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Advanced AI Technology
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  We use Google's Gemini AI models, specifically trained to understand
                  resume structures and job requirements, ensuring high-quality tailoring
                  that maintains factual accuracy.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Truth & Accuracy First
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Our AI is designed with strict guardrails to never add false information.
                  It only rephrases and reorganizes your existing experience to better match
                  job requirements.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Industry-Agnostic
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Whether you're in tech, healthcare, finance, or any other field, our AI
                  adapts to your industry's specific requirements and conventions.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    ATS-Optimized
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Every tailored resume is formatted to pass Applicant Tracking Systems,
                  ensuring your application reaches human recruiters.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              AAA Resume is built with modern, reliable technologies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>
                <strong>Frontend:</strong> React, TypeScript, Vite, Tailwind CSS, Shadcn UI
              </li>
              <li>
                <strong>Backend:</strong> FastAPI (Python), Google Gemini AI
              </li>
              <li>
                <strong>Storage & Auth:</strong> Supabase (PostgreSQL, Storage, Authentication)
              </li>
              <li>
                <strong>AI Models:</strong> Gemini 2.5 Flash for resume parsing and tailoring
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Our Commitment
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We're committed to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Maintaining the highest standards of data security and privacy</li>
              <li>Continuously improving our AI models for better results</li>
              <li>Providing transparent, honest service to all users</li>
              <li>Supporting job seekers at every stage of their career journey</li>
            </ul>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}


