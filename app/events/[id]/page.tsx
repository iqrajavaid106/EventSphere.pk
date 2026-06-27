"use client"

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import moment from 'moment'
import { useUser } from '@/hooks/useUser'
import { useState, use, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EventMap = dynamic(() => import('@/components/features/EventMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
})

import EventChat from '@/components/features/EventChat'

export default function EventDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const eventId = params.id
  const router = useRouter()
  const { data: userObj } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()
  const [isBooking, setIsBooking] = useState(false)
  const [selectedTier, setSelectedTier] = useState('')

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(name),
          profiles:organizer_id(full_name, avatar_url)
        `)
        .eq('id', eventId)
        .single()
      
      if (error) throw error
      return data as any
    }
  })

  const { data: tickets, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets', eventId, user?.id],
    queryFn: async () => {
      if (!user) return [] as any[]
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
      if (error) throw error
      return data as any[]
    },
    enabled: !!user
  })

  // Dynamic ticket tiers calculation
  const defaultTiers = [
    { name: 'Regular', price: 50 },
    { name: 'VIP', price: 150 },
    { name: 'Student', price: 25 }
  ]
  const tiers = event && Array.isArray(event.ticket_tiers) ? event.ticket_tiers : defaultTiers

  useEffect(() => {
    if (tiers.length > 0 && !selectedTier) {
      setSelectedTier(tiers[0].name)
    }
  }, [tiers, selectedTier])

  const activeTier = tiers.find((t: any) => t.name === selectedTier) || tiers[0] || { name: 'Regular', price: 50 }
  const basePrice = Number(activeTier.price) || 0

  // Apply Coupon logic
  const handleApplyCoupon = () => {
    setCouponError('')
    setAppliedCoupon(null)

    if (!couponInput.trim()) return

    const code = couponInput.trim().toUpperCase()
    const couponsList = event && Array.isArray(event.coupons) ? event.coupons : []
    const foundCoupon = couponsList.find((c: any) => c.code.toUpperCase() === code)

    if (!foundCoupon) {
      setCouponError('Invalid coupon code.')
      return
    }

    const usedCount = Number(foundCoupon.used_count) || 0
    const maxUses = Number(foundCoupon.max_uses) || 0
    if (usedCount >= maxUses) {
      setCouponError('This coupon has expired (max uses reached).')
      return
    }

    setAppliedCoupon(foundCoupon)
  }

  // Clear coupon when changing tier
  useEffect(() => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }, [selectedTier])

  const discountPercent = appliedCoupon ? Number(appliedCoupon.discount_percent) || 0 : 0
  const finalPrice = Math.max(0, basePrice * (1 - discountPercent / 100))

  const handleBookTicket = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    setIsBooking(true)
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId, 
          userId: user.id, 
          tier: selectedTier, 
          price: finalPrice,
          couponCode: appliedCoupon ? appliedCoupon.code : null
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout')
      
      // Redirect to Stripe
      window.location.href = data.url
    } catch (err: any) {
      alert('Checkout failed: ' + err.message)
      setIsBooking(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading Event...</div>
  if (error || !event) return <div className="p-20 text-center text-red-500">Event not found</div>

  const hasBooked = tickets && tickets.length > 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Banner */}
      <div className="relative w-full h-[40vh] md:h-[50vh] bg-zinc-900">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 mx-auto max-w-7xl">
          {event.event_categories && (
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full tracking-wider mb-4 inline-block">
              {event.event_categories.name}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-zinc-300 text-sm font-medium">
            <span className="flex items-center gap-1">
              📍 {event.location_name || 'Online Event'}
            </span>
            <span className="flex items-center gap-1">
              🗓️ {moment(event.start_date).format('MMMM Do YYYY, h:mm A')}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">About this Event</h2>
            <div className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {event.description || 'No description provided.'}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Organizer</h2>
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {event.profiles?.avatar_url ? (
                  <img src={event.profiles.avatar_url} alt="Organizer" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{event.profiles?.full_name || 'Unknown Organizer'}</p>
                <p className="text-xs text-zinc-500">Event Organizer</p>
              </div>
            </div>
          </section>

          {event.latitude && event.longitude && (
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Location</h2>
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <EventMap lat={event.latitude} lng={event.longitude} title={event.location_name || event.title} />
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium">📍 {event.location_name}</p>
            </section>
          )}

          <section className="pt-8">
            <EventChat eventId={eventId} />
          </section>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Ticket Price</p>
                {appliedCoupon ? (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-green-600 dark:text-green-400">${finalPrice}</span>
                    <span className="text-lg text-zinc-400 line-through">${basePrice}</span>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                    {basePrice === 0 ? 'Free' : `$${basePrice}`}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Ticket Tier</span>
                  {!hasBooked && (
                    <select 
                      value={selectedTier} 
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="border border-zinc-200 dark:border-zinc-800 bg-transparent rounded-md px-2 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {tiers.map((t: any, idx: number) => (
                        <option key={idx} value={t.name}>{t.name} - ${t.price}</option>
                      ))}
                    </select>
                  )}
                  {hasBooked && <span className="font-medium capitalize">{tickets[0]?.ticket_type}</span>}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Date</span>
                  <span className="font-medium">{moment(event.start_date).format('MMM Do YYYY')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Time</span>
                  <span className="font-medium">{moment(event.start_date).format('h:mm A')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Capacity</span>
                  <span className="font-medium">{event.capacity} Spots</span>
                </div>
              </div>

              {/* Coupon Code Panel */}
              {!hasBooked && basePrice > 0 && (
                <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Label htmlFor="coupon" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Promo Coupon</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="coupon" 
                      placeholder="e.g. SAVE20" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={appliedCoupon}
                      className="h-9 text-sm"
                    />
                    {appliedCoupon ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-9 px-3 text-xs" 
                        onClick={() => {
                          setAppliedCoupon(null)
                          setCouponInput('')
                        }}
                      >
                        Reset
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        className="h-9 px-4 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900" 
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-green-600 dark:text-green-400 text-xs font-medium">
                      ✓ Promo Applied: {appliedCoupon.discount_percent}% off!
                    </p>
                  )}
                </div>
              )}

              {hasBooked ? (
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                  Ticket Booked Successfully
                </Button>
              ) : (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg" 
                  onClick={handleBookTicket}
                  disabled={isBooking}
                >
                  {isBooking ? 'Processing...' : 'Book Ticket'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
