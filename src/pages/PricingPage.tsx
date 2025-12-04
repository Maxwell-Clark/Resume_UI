import { Link, useNavigate } from 'react-router-dom'
import { PublicLayout } from '@/components/PublicLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Check } from 'lucide-react'

export function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (user) {
      navigate('/tailor')
    } else {
      navigate('/signup')
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out our service',
      features: [
        '5 resume tailors per month',
        'Basic AI tailoring',
        'PDF download',
        'Resume history (30 days)',
        'Email support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For serious job seekers',
      features: [
        'Unlimited resume tailors',
        'Advanced AI tailoring',
        'PDF & LaTeX download',
        'Resume history (unlimited)',
        'Priority support',
        'Custom prompts',
        'Bulk processing',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
        'Custom branding',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that works best for you. All plans include our core AI-powered resume tailoring.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white dark:bg-slate-800 rounded-lg border-2 p-8 ${
                plan.popular
                  ? 'border-blue-600 dark:border-blue-400 shadow-lg scale-105'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 dark:bg-blue-700 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    /{plan.period}
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                onClick={plan.name === 'Enterprise' ? () => navigate('/contact') : handleGetStarted}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            All plans include
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                AI-Powered Tailoring
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Advanced Gemini AI analyzes job descriptions and optimizes your resume
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Secure Storage
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your resumes are stored securely in Supabase cloud storage
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ATS Optimization
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Resumes formatted to pass applicant tracking systems
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

