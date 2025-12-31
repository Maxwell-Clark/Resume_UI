import { PublicLayout } from '@/components/PublicLayout'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How does AI resume tailoring work?',
      answer: 'Our AI uses advanced Gemini models to analyze your resume and the job description. It identifies key skills, requirements, and keywords from the job posting, then optimizes your resume to highlight relevant experience and match the job description while maintaining accuracy and truthfulness.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'Currently, we support PDF uploads for resumes. The tailored resume can be downloaded as PDF, LaTeX, or JSON format. We\'re working on adding support for DOCX files in the future.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, absolutely. All resumes are stored securely in Supabase cloud storage with encryption at rest. We use industry-standard security practices and never share your data with third parties. Your account information is protected with secure authentication.',
    },
    {
      question: 'How accurate is the AI tailoring?',
      answer: 'Our AI is trained to maintain factual accuracy. It will not add false information, new employers, or skills you don\'t have. It focuses on rephrasing and reorganizing your existing experience to better match job requirements while preserving all original facts, dates, and metrics.',
    },
    {
      question: 'Can I customize the AI prompt?',
      answer: 'Yes! Pro and Enterprise users can customize the analysis prompt to fine-tune how the AI tailors resumes. You can adjust the emphasis on different aspects like technical skills, leadership experience, or industry-specific requirements.',
    },
    {
      question: 'How long does it take to tailor a resume?',
      answer: 'Typically, resume tailoring takes 30-60 seconds. The process includes parsing your resume, analyzing the job description, and generating the tailored version. Processing time may vary based on resume complexity and server load.',
    },
    {
      question: 'What happens to my old resumes?',
      answer: 'All your tailored resumes are saved in your history. You can access, download, or delete them at any time. Free plan users have access to resumes for 30 days, while Pro and Enterprise users have unlimited history.',
    },
    {
      question: 'Can I use this for multiple job applications?',
      answer: 'Absolutely! That\'s the main benefit of our service. You can tailor your resume for as many job applications as you need. Each tailored resume is saved separately in your history, making it easy to track which resume you used for which application.',
    },
    {
      question: 'Do you support international resumes?',
      answer: 'Yes, our AI is designed to work with resumes from any country or industry. It adapts to different date formats, educational systems, and professional conventions. The system is industry-agnostic and works across tech, healthcare, finance, and more.',
    },
    {
      question: 'What if I\'m not satisfied with the result?',
      answer: 'You can always re-tailor your resume with a different prompt or make manual adjustments. If you encounter any issues, our support team is here to help. Pro and Enterprise users get priority support.',
    },
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Everything you need to know about AAA Resume
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Still have questions?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Can't find the answer you're looking for? Please reach out to our support team.
          </p>
          <a href="/contact">
            <button className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium">
              Contact Support
            </button>
          </a>
        </div>
      </div>
    </PublicLayout>
  )
}









