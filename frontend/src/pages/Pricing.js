import PageHeader from '../components/page-header';
import { useState } from 'react';

const plans = [
  {
    title: 'Free',
    price: '$0',
    period: '/month',
    features: ['Up to 5 users', 'Email support', 'Basic reporting'],
    buttonLabel: 'Buy Now',
    highlight: false
  },
  {
    title: 'Business',
    price: '$29',
    period: '/month',
    features: ['Up to 25 users', 'Priority email support', 'Advanced reporting', 'Integrations'],
    buttonLabel: 'Buy Now',
    highlight: true
  },
  {
    title: 'Developer',
    price: '$99',
    period: '/month',
    features: ['Unlimited users', 'Phone & email support', 'Custom integrations', 'SLA & onboarding'],
    buttonLabel: 'Buy Now',
    highlight: false
  },
  {
    title: 'Ultimate',
    price: 'Custom',
    period: '',
    features: ['Dedicated account manager', 'SLA & 24/7 support', 'On-prem or private cloud', 'Custom SLAs'],
    buttonLabel: 'Buy Now',
    highlight: false,
    ribbon: 'Recommended'
  }
];

const faqs = [
  {
    question: 'What is included in the trial?',
    answer:
      'The trial includes full access to Professional features for 14 days. No credit card required.',
    open: true
  },
  { question: 'Can I upgrade or downgrade my plan?', answer: 'Yes — you can upgrade or downgrade at any time through the billing portal.', open: false },
  { question: 'Do you offer custom integrations?', answer: 'Yes — Business and Enterprise plans include custom integrations and API access.', open: false },
  { question: 'What support SLA is provided?', answer: 'Enterprise plans include a dedicated account manager and 24/7 support with guaranteed response times.', open: false },
  { question: 'How do I request a custom quote?', answer: 'Click "Request Quote" on the Enterprise plan or contact sales@company.com for a tailored proposal.', open: false }
];

const Pricing = () => {
  const [faqsState, setFaqsState] = useState(faqs);

  const toggleFaq = (index) => {
    setFaqsState((prev) => prev.map((f, i) => (i === index ? { ...f, open: !f.open } : f)));
  };

  return (
    <>
      <PageHeader title="Pricing" />

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className={`relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-8 transition transform hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-2 border-[#22C55E] shadow-lg'
                  : 'border border-slate-200 shadow-sm ring-1 ring-slate-50'
              }`}
            >
              {plan.ribbon ? (
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-[#22C55E] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                  {plan.ribbon}
                </div>
              ) : null}

              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-slate-500">{plan.title}</div>

                <div className="mt-6">
                  <div className="text-5xl font-semibold text-[#22C55E]">{plan.price}</div>
                  <div className="mt-1 text-sm text-slate-500">{plan.period}</div>
                </div>

                <ul className="mt-8 space-y-4 text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[#22C55E]">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <button className={`w-full rounded-full py-3 text-sm font-semibold text-white transition ${plan.highlight ? 'bg-[#22C55E] hover:bg-emerald-700' : 'bg-[#22C55E] hover:bg-emerald-700'}`}>
                  {plan.buttonLabel}
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 uppercase">FREQUENTLY ASKED QUESTIONS</h2>
            <div className="mx-auto mt-3 h-1 w-24 rounded bg-[#22C55E]" />
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Have questions? We’ve got answers for the most popular pricing and plan topics.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            {faqsState.map((item, index) => (
              <div key={item.question} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between text-left text-base font-medium text-slate-900"
                  aria-expanded={item.open}
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">?</span>
                    <span>{item.question}</span>
                  </div>
                  <svg
                    className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${item.open ? 'rotate-90' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 4l8 6-8 6" />
                  </svg>
                </button>
                <div className={`mt-4 text-slate-600 ${item.open ? 'block' : 'hidden'}`}>{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
