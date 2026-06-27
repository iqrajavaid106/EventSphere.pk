'use client'

import { useState, useEffect } from 'react'
import { Check, Sparkles, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly')
  const { data: userObj, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && userObj) {
      const role = (userObj as any)?.profile?.roles?.name
      if (role === 'attendee') {
        router.replace('/')
      }
    }
  }, [userObj, isLoading, router])

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading...</div>
  }

  const role = (userObj as any)?.profile?.roles?.name
  if (role === 'attendee') {
    return <div className="p-12 text-center animate-pulse">Redirecting...</div>
  }

  const plans = [
    {
      name: 'Attendee',
      price: { monthly: 0, annually: 0 },
      description: 'For casual event attendees looking to discover local experiences.',
      features: [
        'Browse all hyper-local events',
        'Filter by category, city, and date',
        'GPS-based proximity event sorting',
        'Secure digital ticket generation (QR)',
        'Access to live community event chatrooms',
      ],
      buttonText: 'Get Started (Free)',
      href: '/login',
      popular: false,
    },
    {
      name: 'Organizer Starter',
      price: { monthly: 19, annually: 15 },
      description: 'Ideal for local event hosts, businesses, and content creators.',
      features: [
        'All Attendee features included',
        'Host up to 5 events per month',
        'Secure Stripe payment processing',
        'Scan tickets with the Organizer Dashboard',
        'Real-time attendance metrics',
        'Basic custom ticket designs',
      ],
      buttonText: 'Start Free Trial',
      href: '/register',
      popular: true,
    },
    {
      name: 'Organizer Pro',
      price: { monthly: 49, annually: 39 },
      description: 'Built for professional event management agencies and venues.',
      features: [
        'All Organizer Starter features',
        'Host unlimited events',
        'Advanced attendee analytics reports',
        'Priority 24/7 organizer support',
        'Capacity manager & automated waitlists',
        'No platform commission fee on ticket sales',
      ],
      buttonText: 'Upgrade to Pro',
      href: '/register',
      popular: false,
    },
  ]

  return (
    <div className="relative min-h-screen bg-zinc-50 py-16 dark:bg-zinc-950">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/10" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-100/30 blur-3xl dark:bg-purple-900/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Pricing Header */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Sparkles className="h-3 w-3" />
            Simple, Transparent Pricing
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Flexible Plans for Everyone
          </h1>
          <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Whether you want to browse local activities or coordinate thousands of attendees, we have the right fit. Save 20% on annual billing!
          </p>
        </div>

        {/* Billing Toggle Switch */}
        <div className="mt-10 flex justify-center">
          <div className="relative flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                billingInterval === 'monthly'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annually')}
              className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                billingInterval === 'annually'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Annually (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:max-w-7xl lg:grid-cols-3">
          {plans.map((plan) => {
            const currentPrice = billingInterval === 'monthly' ? plan.price.monthly : plan.price.annually
            const savings = plan.price.monthly - plan.price.annually

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 border ${
                  plan.popular
                    ? 'bg-white border-blue-600 shadow-lg scale-105 z-10 dark:bg-zinc-900 dark:border-blue-400'
                    : 'bg-white/80 backdrop-blur-sm border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                {/* Popular Ribbon */}
                {plan.popular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white dark:bg-blue-400 dark:text-zinc-950">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 min-h-[40px]">{plan.description}</p>
                  
                  {/* Price Section */}
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                      ${currentPrice}
                    </span>
                    <span className="ml-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      /month
                    </span>
                  </div>

                  {/* Savings / Billed text */}
                  <div className="mt-1 h-5">
                    {billingInterval === 'annually' && currentPrice > 0 && (
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        Billed annually (save ${savings * 12}/yr)
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-zinc-100 dark:border-zinc-800" />

                  {/* Features List */}
                  <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call To Action Button */}
                <div className="mt-8">
                  <Link
                    href={plan.href}
                    className={`block w-full text-center rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pricing FAQ section */}
        <div className="mx-auto mt-24 max-w-4xl border-t border-zinc-200 pt-16 dark:border-zinc-800">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                How does ticket scanning work?
              </h4>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Organizers gain access to a dedicated URL in their dashboard `/organizer/events/[id]/scanner` where they can scan the QR code printed on the attendee's ticket. The platform checks legitimacy in real-time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Can I cancel my organizer plan anytime?
              </h4>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Yes, you can downgrade or cancel your subscription at any time directly through your dashboard settings. No contracts or cancellation fees.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
