// components/home/HeroSection.tsx
'use client'

import { useState } from 'react'

interface HeroSectionProps {
  searchTerm: string
  setSearchTerm: (val: string) => void
  selectedCity: string
  setSelectedCity: (val: string) => void
  radius: string
  setRadius: (val: string) => void
  onGpsChange: (lat: number | null, lng: number | null) => void
}

export default function HeroSection({
  searchTerm,
  setSearchTerm,
  selectedCity,
  setSelectedCity,
  radius,
  setRadius,
  onGpsChange
}: HeroSectionProps) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

    const popularCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad']

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.')
      return
    }

    setGpsLoading(true)
    setLocationStatus('Locating...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onGpsChange(latitude, longitude)
        setSelectedCity('Nearby')
        setLocationStatus('')
        setGpsLoading(false)
      },
      () => {
        setLocationStatus('Unable to retrieve your location.')
        setGpsLoading(false)
      }
    )
  }

  return (
    <div className="relative isolate overflow-hidden bg-zinc-900 px-6 py-20 sm:py-28 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.zinc.800),theme(colors.zinc.950))]" />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Discover Extraordinary <span className="text-blue-500">AI</span> Events
        </h1>

        <div className="mx-auto mt-10 max-w-2xl bg-white p-2 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col md:flex-row items-stretch gap-2">
          <div className="flex-1 min-w-0 relative flex items-center">
            {/* The input updates parent state immediately, triggering our 300ms debounce loop */}
            <input
              type="text"
              placeholder="Search events, topics, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-3 text-sm text-zinc-900 bg-transparent focus:outline-none dark:text-white"
            />
          </div>

          <div className="h-px md:h-8 w-full md:w-px bg-zinc-200 dark:border-zinc-800 self-center" />

          <div className="flex items-center gap-2 px-2">
            <button
              type="button"
              onClick={handleGPSLocation}
              disabled={gpsLoading}
              className={`p-2 rounded-lg border text-zinc-600 dark:text-zinc-400 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                gpsLoading ? 'animate-pulse text-blue-600 bg-blue-50' : ''
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </button>

            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                if (e.target.value !== 'Nearby') onGpsChange(null, null)
              }}
              className="bg-transparent text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer py-2"
            >
              <option value="All">All Cities</option>
              <option value="Nearby">📍 Nearby (GPS)</option>
              {popularCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="h-px md:h-8 w-full md:w-px bg-zinc-200 dark:border-zinc-800 self-center" />

          <div className="flex items-center px-2">
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="bg-transparent text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer py-2"
            >
              <option value="5">+ 5 mi</option>
              <option value="25">+ 25 mi</option>
              <option value="50">+ 50 mi</option>
            </select>
          </div>
        </div>
        {locationStatus && <p className="mt-2 text-xs text-zinc-400">{locationStatus}</p>}
      </div>
    </div>
  )
}