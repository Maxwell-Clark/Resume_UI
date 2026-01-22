import { PublicLayout } from '@/components/PublicLayout'
import { Sparkles, Shield, Zap, Target, Users, Clock, Heart } from 'lucide-react'

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            About AAA Resume
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400">
            Empowering job seekers with AI-powered resume optimization
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
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

          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              How We're Different
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Advanced AI Technology
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  We use advanced AI specifically designed to understand resume structures
                  and job requirements, ensuring high-quality tailoring that maintains
                  factual accuracy.
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

          <section className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Our Approach
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              We've designed AAA Resume with you in mind. Here's what drives everything we build:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Save Your Time
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tailoring a resume used to take hours. Now it takes seconds.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Accessible to All
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Professional resume optimization shouldn't require expensive consultants.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
                <Heart className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Your Success Matters
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We measure our success by how many interviews you land.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Our Commitment
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We're committed to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Maintaining the highest standards of data security and privacy</li>
              <li>Continuously improving our AI for better results</li>
              <li>Providing transparent, honest service to all users</li>
              <li>Supporting job seekers at every stage of their career journey</li>
            </ul>
          </section>
        </div>
      </div>
    </PublicLayout>
  )
}
