// components/home/EventCard.tsx
'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

// Data interface reflecting full location and ticketing context
export interface AdvancedEventProps {
  id: string
  title: string
  description: string
  date: string
  time: string
  venue: string
  city: string
  category: string
  image_url?: string
  starting_price: number
  venue_lat: number
  venue_lng: number
  userLat?: number // Passed dynamically if user grants browser GPS access
  userLng?: number
}

// 1. Core Haversine Mathematical Computation
function calculateHaversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3956 // Radius of Earth in miles. Use 6371 for kilometers.
  
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Returns distance in miles
}

export default function EventCard({
  id,
  title,
  description,
  date,
  time,
  venue,
  city,
  category,
  image_url,
  starting_price,
  venue_lat,
  venue_lng,
  userLat,
  userLng
}: AdvancedEventProps) {
  
  const fallbackImg = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"

  // 2. Compute live relative proximity metric
  const distance = (userLat && userLng) 
    ? calculateHaversineDistance(userLat, userLng, venue_lat, venue_lng)
    : null

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      
      {/* Banner Framing */}
      <CardHeader className="p-0 relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <img
          src={image_url || fallbackImg}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        {/* Floating Category Badge */}
        <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
          {category}
        </span>
      </CardHeader>

      {/* Primary Context Data Info */}
      <CardContent className="flex flex-1 flex-col p-5 space-y-2.5">
        
        {/* Dynamic Location Meta Indicators */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <span>{venue}</span>
          <span>&bull;</span>
          <span className="text-zinc-900 dark:text-zinc-200">{city}</span>
          {distance !== null && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {distance.toFixed(1)} miles away
              </span>
            </>
          )}
        </div>

        {/* Header Title */}
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        
        {/* Description Payload Paragraph */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-1">
          {description}
        </p>

        {/* Live Timing Logistics Row */}
        <div className="flex items-center gap-3 text-xs bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{time}</span>
          </div>
        </div>

      </CardContent>

      {/* Pricing and Deep Redirect Layout Actions */}
      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3 mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Tickets From</span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {starting_price === 0 ? 'Free' : `$${starting_price}`}
          </span>
        </div>
        
        <Link
          href={`/events/${id}`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors"
        >
          Get Tickets
        </Link>
      </CardFooter>
    </Card>
  )
}