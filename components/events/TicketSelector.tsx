// components/events/TicketSelector.tsx
'use client'

import { useState } from 'react'

interface TicketTier {
  id: string
  name: string
  price: number
  description: string
  available: number
}

interface TicketSelectorProps {
  basePrice: number
  onCheckout: (selectedTickets: { [key: string]: number }) => void
}

export default function TicketSelector({ basePrice, onCheckout }: TicketSelectorProps) {
  // Generate tier values dynamically using your base price context mapping
  const tiers: TicketTier[] = [
    { id: 'regular', name: 'Regular Pass', price: basePrice, description: 'Standard general admission entry to all main keynotes.', available: 15 },
    { id: 'vip', name: 'VIP Access', price: Math.round(basePrice * 2.5), description: 'Front-row seating structure, backstage lounge entry, and recorded notes.', available: 5 },
    { id: 'student', name: 'Student Discount', price: Math.round(basePrice * 0.6), description: 'Valid academic ID verification required at structural checkpoints.', available: 8 }
  ]

  const [quantities, setQuantities] = useState<{ [key: string]: number }>({
    regular: 0,
    vip: 0,
    student: 0
  })

  const handleQtyChange = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0
      const next = Math.min(Math.max(current + delta, 0), max)
      return { ...prev, [id]: next }
    })
  }

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0)
  const totalPrice = tiers.reduce((sum, tier) => sum + (quantities[tier.id] * tier.price), 0)

  return (
    <div className="w-full space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Select Registration Tiers</h4>
      
      <div className="space-y-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex flex-col gap-1 p-2.5 rounded-lg bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{tier.name}</span>
                <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {tier.price === 0 ? 'Free' : `$${tier.price}`}
                </span>
              </div>

              {/* Quantity Adjuster Pod */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQtyChange(tier.id, -1, tier.available)}
                  className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  -
                </button>
                <span className="w-4 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {quantities[tier.id]}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(tier.id, 1, tier.available)}
                  className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Pricing Aggregate & Checkout Launcher Button */}
      {totalTickets > 0 && (
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 animation-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
            <span>Summary Matrix ({totalTickets}):</span>
            <span className="text-sm text-blue-600 dark:text-blue-400">${totalPrice}</span>
          </div>
          <button
            type="button"
            onClick={() => onCheckout(quantities)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            Reserve Tickets Now
          </button>
        </div>
      )}
    </div>
  )
}