"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import moment from 'moment'

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location_name: z.string().min(3, 'Location is required'),
  city: z.string().min(1, 'City is required'),
  start_date: z.string().nonempty('Start date is required'),
  end_date: z.string().nonempty('End date is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  category_id: z.coerce.number().optional(),
  banner_url: z.string().url('Must be a valid URL starting with http/https').or(z.literal('')).optional()
})

type EventFormValues = z.infer<typeof eventSchema>

export default function EditEventPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const eventId = params.id
  const router = useRouter()
  const { data: userObj, isLoading: isUserLoading } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()

  // Fetch categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
      if (error) throw error
      return data || []
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventData, setEventData] = useState<any>(null)

  // Ticket Tiers State
  const [ticketTiers, setTicketTiers] = useState<Array<{ name: string; price: number }>>([])

  // Coupons State
  const [coupons, setCoupons] = useState<Array<{ code: string; discount_percent: number; max_uses: number; used_count: number }>>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(eventSchema)
  })

  // Load event details
  useEffect(() => {
    async function loadEvent() {
      if (!user) return
      try {
        const { data, error } = await (supabase.from('events') as any)
          .select('*')
          .eq('id', eventId)
          .single()

        if (error) throw error

        const isAdmin = (userObj as any)?.profile?.roles?.name === 'admin'
        if (data.organizer_id !== user.id && !isAdmin) {
          alert("You are not authorized to edit this event.")
          router.push('/organizer')
          return
        }

        setEventData(data)
        
        // Populating form fields
        setValue('title', data.title)
        setValue('description', data.description || '')
        setValue('location_name', data.location_name || '')
        setValue('city', data.city || 'New York')
        setValue('capacity', data.capacity)
        setValue('category_id', data.category_id || undefined)
        setValue('banner_url', data.banner_url || '')

        // Date conversions to local YYYY-MM-DDTHH:mm
        setValue('start_date', moment(data.start_date).format('YYYY-MM-DDTHH:mm'))
        setValue('end_date', moment(data.end_date).format('YYYY-MM-DDTHH:mm'))

        // Ticket tiers and coupons fallback logic
        const tiers = data.ticket_tiers || [
          { name: 'Regular', price: 50 },
          { name: 'VIP', price: 150 },
          { name: 'Student', price: 25 }
        ]
        setTicketTiers(tiers)

        const cps = data.coupons || []
        setCoupons(cps)
      } catch (err: any) {
        alert("Failed to load event: " + err.message)
        router.push('/organizer')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadEvent()
    }
  }, [user, eventId, setValue, router])

  // Handlers for Ticket Tiers
  const handleAddTier = () => {
    setTicketTiers([...ticketTiers, { name: '', price: 0 }])
  }

  const handleRemoveTier = (index: number) => {
    if (ticketTiers.length <= 1) {
      alert("At least one ticket tier is required.")
      return
    }
    setTicketTiers(ticketTiers.filter((_, i) => i !== index))
  }

  const handleTierChange = (index: number, field: 'name' | 'price', value: any) => {
    const updated = [...ticketTiers]
    if (field === 'price') {
      updated[index].price = Math.max(0, Number(value) || 0)
    } else {
      updated[index].name = value
    }
    setTicketTiers(updated)
  }

  // Handlers for Coupons
  const handleAddCoupon = () => {
    setCoupons([...coupons, { code: '', discount_percent: 10, max_uses: 10, used_count: 0 }])
  }

  const handleRemoveCoupon = (index: number) => {
    setCoupons(coupons.filter((_, i) => i !== index))
  }

  const handleCouponChange = (index: number, field: 'code' | 'discount_percent' | 'max_uses', value: any) => {
    const updated = [...coupons]
    if (field === 'code') {
      updated[index].code = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    } else if (field === 'discount_percent') {
      updated[index].discount_percent = Math.min(100, Math.max(1, Number(value) || 0))
    } else if (field === 'max_uses') {
      updated[index].max_uses = Math.max(1, Number(value) || 0)
    }
    setCoupons(updated)
  }

  const onSubmit = async (data: any) => {
    if (!user || !eventData) return

    // Validate Tiers
    const invalidTier = ticketTiers.find(t => !t.name.trim())
    if (invalidTier) {
      alert("Please ensure all ticket tiers have a valid name.")
      return
    }

    // Validate Coupons
    const invalidCoupon = coupons.find(c => !c.code.trim())
    if (invalidCoupon) {
      alert("Please ensure all coupon codes have a valid, unique code name.")
      return
    }

    // Check unique coupon codes
    const codes = coupons.map(c => c.code.trim())
    if (new Set(codes).size !== codes.length) {
      alert("Coupon codes must be unique.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const { error } = await (supabase.from('events') as any)
        .update({
          ...data,
          start_date: new Date(data.start_date).toISOString(),
          end_date: new Date(data.end_date).toISOString(),
          ticket_tiers: ticketTiers,
          coupons: coupons,
          // Let's keep status as is or make it pending approval again if changes require re-review
          is_published: eventData.is_published 
        })
        .eq('id', eventId)

      if (error) throw error
      
      alert('Event updated successfully!')
      const isAdmin = (userObj as any)?.profile?.roles?.name === 'admin'
      if (isAdmin) {
        router.push('/dashboard')
      } else {
        router.push('/organizer')
      }
    } catch (err: any) {
      alert('Failed to update event: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleName = (userObj as any)?.profile?.roles?.name
  const isOrganizerOrAdmin = roleName === 'organizer' || roleName === 'admin'
  const isOwner = eventData && eventData.organizer_id === user?.id
  const isAuthorized = isOrganizerOrAdmin || isOwner

  if (isUserLoading || isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading Event details...</div>
  }

  if (!user) {
    return <div className="p-12 text-center text-zinc-500">Please log in.</div>
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm">You must be an organizer or an administrator to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Edit Event Details</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Update your event dates, pricing, or coupons below.</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="e.g. Next.js Developer Meetup" {...register('title')} />
                {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_url">Event Banner Image URL</Label>
                <Input id="banner_url" placeholder="https://example.com/banner.jpg" {...register('banner_url')} />
                {errors.banner_url && <p className="text-red-500 text-xs">{errors.banner_url.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Event Category</Label>
                <select 
                  id="category_id"
                  {...register('category_id')}
                  className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                >
                  <option value="">Select a Category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-500 text-xs">{errors.category_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea 
                  id="description" 
                  rows={4}
                  placeholder="Tell us about the event..."
                  className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                  {...register('description')} 
                />
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location_name">Venue / Location</Label>
                  <Input id="location_name" placeholder="e.g. Central Park" {...register('location_name')} />
                  {errors.location_name && <p className="text-red-500 text-xs">{errors.location_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <select 
                    id="city"
                    {...register('city')}
                    className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                  >
                    <option value="New York">New York</option>
                    <option value="San Francisco">San Francisco</option>
                    <option value="London">London</option>
                    <option value="Toronto">Toronto</option>
                    <option value="Tokyo">Tokyo</option>
                  </select>
                  {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity</Label>
                  <Input id="capacity" type="number" placeholder="100" {...register('capacity')} />
                  {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <Input id="start_date" type="datetime-local" {...register('start_date')} />
                  {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input id="end_date" type="datetime-local" {...register('end_date')} />
                  {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date.message}</p>}
                </div>
              </div>

              {/* Ticket Tiers Customization */}
              <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ticket Tiers</h3>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tier
                  </button>
                </div>
                <div className="space-y-3">
                  {ticketTiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Input
                          placeholder="Tier Name (e.g. Regular, VIP, Student)"
                          value={tier.name}
                          onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Price ($)"
                          value={tier.price}
                          onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                          min="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        disabled={ticketTiers.length <= 1}
                        className="p-2.5 rounded border border-zinc-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupons Customization */}
              <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Event Coupons</h3>
                  <button
                    type="button"
                    onClick={handleAddCoupon}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Coupon
                  </button>
                </div>
                {coupons.length === 0 ? (
                  <p className="text-xs text-zinc-500">No coupons configured. Attendees will pay full ticket price.</p>
                ) : (
                  <div className="space-y-3">
                    {coupons.map((coupon, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="COUPONCODE"
                            value={coupon.code}
                            onChange={(e) => handleCouponChange(idx, 'code', e.target.value)}
                          />
                        </div>
                        <div className="w-36">
                          <Input
                            type="number"
                            placeholder="Discount (%)"
                            value={coupon.discount_percent}
                            onChange={(e) => handleCouponChange(idx, 'discount_percent', e.target.value)}
                            min="1"
                            max="100"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Max Uses"
                            value={coupon.max_uses}
                            onChange={(e) => handleCouponChange(idx, 'max_uses', e.target.value)}
                            min="1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoupon(idx)}
                          className="p-2.5 rounded border border-zinc-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:hover:bg-red-950 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end border-t border-zinc-200 dark:border-zinc-800 gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
