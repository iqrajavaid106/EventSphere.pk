// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useDebounce } from 'use-debounce'
import HeroSection from "@/components/home/HeroSection"
import SearchFilters from "@/components/home/SearchFilters"
import EventGrid from '@/components/home/EventGrid'
import { useEvents } from '@/hooks/useEvents'
import { useGeolocation } from '@/hooks/useGeolocation'

const ITEMS_PER_PAGE = 12

export default function Home() {
    const { data: userObj } = useUser()
    const router = useRouter()

    useEffect(() => {
        const role = (userObj as any)?.profile?.roles?.name
        if (role === 'admin') {
            // Corrected redirect from '/dashboard' to '/admin' to match app/admin/page.tsx location
            router.replace('/admin')
        } else if (role === 'organizer') {
            router.replace('/organizer')
        }
    }, [userObj, router])

    // Shared Query & Filtering States
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [selectedCity, setSelectedCity] = useState('All')
    const [dateFilter, setDateFilter] = useState('')
    const [radius, setRadius] = useState('25')

    // Coordinates for distance calculations
    const [userLat, setUserLat] = useState<number | null>(null)
    const [userLng, setUserLng] = useState<number | null>(null)

    // Tracker State
    const [page, setPage] = useState(0)

    // Debounce input text
    const [debouncedSearch] = useDebounce(searchTerm, 300)

    // Fetch events using custom hook
    const { data: events, isLoading, isError } = useEvents({
        search: debouncedSearch,
        limit: ITEMS_PER_PAGE * (page + 1)
    })

    // Reset to page 0 whenever filters change
    useEffect(() => {
        setPage(0)
    }, [debouncedSearch, activeCategory, selectedCity, dateFilter, radius])

    // Filter events locally by city and category
    const filteredEvents = events?.filter(event => {
        if (activeCategory !== 'All' && event.event_categories?.name !== activeCategory) return false
        if (selectedCity !== 'All' && event.city !== selectedCity) return false
        return true
    }) || []

    // Get current page slice
    const paginatedEvents = filteredEvents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

    const currentRole = (userObj as any)?.profile?.roles?.name
    if (currentRole === 'admin' || currentRole === 'organizer') {
        return <div className="p-12 text-center animate-pulse">Redirecting...</div>
    }

    return (
        <div className="w-full space-y-6 pb-16">
            <HeroSection
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                radius={radius}
                setRadius={setRadius}
                onGpsChange={(lat, lng) => {
                    setUserLat(lat)
                    setUserLng(lng)
                }}
            />

            <div className="mx-auto max-w-7xl px-6 space-y-8">
                <SearchFilters
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Trending Events Nearby</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Handpicked event configurations processing live right now.</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[300px] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-red-500 text-center py-10">Failed to load events.</div>
                ) : (
                    <EventGrid
                        events={paginatedEvents}
                        userLat={userLat || undefined}
                        userLng={userLng || undefined}
                    />
                )}

                {/* --- Pagination Action Controls --- */}
                <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Showing Page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{page + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => {
                                setPage((prev) => Math.max(prev - 1, 0))
                                window.scrollTo({ top: 400, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
                        >
                            &larr; Previous
                        </button>

                        <button
                            type="button"
                            disabled={filteredEvents.length <= (page + 1) * ITEMS_PER_PAGE}
                            onClick={() => {
                                setPage((prev) => prev + 1)
                                window.scrollTo({ top: 400, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
                        >
                            Next &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useDebounce } from 'use-debounce'
import HeroSection from "@/components/home/HeroSection"
import SearchFilters from "@/components/home/SearchFilters"
import EventGrid from '@/components/home/EventGrid'
import { useEvents } from '@/hooks/useEvents'
import { useGeolocation } from '@/hooks/useGeolocation'

const ITEMS_PER_PAGE = 12

export default function Home() {
    const { data: userObj } = useUser()
    const router = useRouter()

    useEffect(() => {
        const role = (userObj as any)?.profile?.roles?.name
        if (role === 'admin') {
            // Corrected redirect from '/dashboard' to '/admin' to match app/admin/page.tsx location
            router.replace('/admin')
        } else if (role === 'organizer') {
            router.replace('/organizer')
        }
    }, [userObj, router])

    // Shared Query & Filtering States
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [selectedCity, setSelectedCity] = useState('All')
    const [dateFilter, setDateFilter] = useState('')
    const [radius, setRadius] = useState('25')

    // Coordinates for distance calculations
    const [userLat, setUserLat] = useState<number | null>(null)
    const [userLng, setUserLng] = useState<number | null>(null)

    // Tracker State
    const [page, setPage] = useState(0)

    // Debounce input text
    const [debouncedSearch] = useDebounce(searchTerm, 300)

    // Fetch events using custom hook
    const { data: events, isLoading, isError } = useEvents({
        search: debouncedSearch,
        limit: ITEMS_PER_PAGE * (page + 1)
    })

    // Reset to page 0 whenever filters change
    useEffect(() => {
        setPage(0)
    }, [debouncedSearch, activeCategory, selectedCity, dateFilter, radius])

    // Filter events locally by city and category
    const filteredEvents = events?.filter(event => {
        if (activeCategory !== 'All' && event.event_categories?.name !== activeCategory) return false
        if (selectedCity !== 'All' && event.city !== selectedCity) return false
        return true
    }) || []

    // Get current page slice
    const paginatedEvents = filteredEvents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

    const currentRole = (userObj as any)?.profile?.roles?.name
    if (currentRole === 'admin' || currentRole === 'organizer') {
        return <div className="p-12 text-center animate-pulse">Redirecting...</div>
    }

    return (
        <div className="w-full space-y-6 pb-16">
            <HeroSection
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                radius={radius}
                setRadius={setRadius}
                onGpsChange={(lat, lng) => {
                    setUserLat(lat)
                    setUserLng(lng)
                }}
            />

            <div className="mx-auto max-w-7xl px-6 space-y-8">
                <SearchFilters
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Trending Events Nearby</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Handpicked event configurations processing live right now.</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[300px] rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-red-500 text-center py-10">Failed to load events.</div>
                ) : (
                    <EventGrid
                        events={paginatedEvents}
                        userLat={userLat || undefined}
                        userLng={userLng || undefined}
                    />
                )}

                {/* --- Pagination Action Controls --- */}
                <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Showing Page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{page + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => {
                                setPage((prev) => Math.max(prev - 1, 0))
                                window.scrollTo({ top: 400, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
                        >
                            &larr; Previous
                        </button>

                        <button
                            type="button"
                            disabled={filteredEvents.length <= (page + 1) * ITEMS_PER_PAGE}
                            onClick={() => {
                                setPage((prev) => prev + 1)
                                window.scrollTo({ top: 400, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
                        >
                            Next &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}