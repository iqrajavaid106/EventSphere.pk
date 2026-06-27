// components/events/EventDetail.tsx
'use client'

import TicketSelector from './TicketSelector'
import Link from 'next/link'
import { AdvancedEventProps } from '../home/EventCard'

interface EventDetailProps {
  event: AdvancedEventProps
  userLat?: number
  userLng?: number
}

function calculateDetailDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3956
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function EventDetail({ event, userLat, userLng }: EventDetailProps) {
  const fallbackImg = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
  
  const distance = (userLat && userLng)
    ? calculateDetailDistance(userLat, userLng, event.venue_lat, event.venue_lng)
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          &larr; Back to Discovery Catalog
        </Link>
        <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-1 rounded">
          ID: {event.id}
        </span>
      </div>

      {/* Main Structural Display Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side Column: Media & Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            <img 
              src={event.image_url || fallbackImg} 
              alt={event.title} 
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {event.category}
              </span>
              {distance !== null && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-1 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30">
                  📍 {distance.toFixed(1)} miles from your location
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {event.title}
            </h1>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">About This Event</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>

        {/* Right Side Column: Sticky Logistics Sidebar Card Block */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-6">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Logistics & Schedule</h3>
            
            <div className="space-y-4 text-sm">
              {/* Date Block */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Date</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Time Block */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Time</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{event.time}</p>
                </div>
              </div>

              {/* Location Venue */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Venue</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{event.venue}</p>
                  <p className="text-xs text-zinc-400 font-medium">{event.city}</p>
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-900" />

            {/* Price Info Box */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Base Entry Cost</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {event.starting_price === 0 ? 'Free Entry' : `$${event.starting_price}`}
                </p>
              </div>
            </div>

            {/* --- FIXED INJECTION ZONE --- */}
            <div className="pt-2">
              <TicketSelector 
                basePrice={event.starting_price} 
                onCheckout={(selected) => console.log('Checkout action array payload loaded:', selected)} 
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}