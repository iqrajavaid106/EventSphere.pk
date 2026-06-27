// components/events/EventForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// 1. Define strict Zod validation schema structure matching database specs
const eventFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters long'),
  category: z.string().min(1, 'Please select a valid category'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  venue: z.string().min(3, 'Venue location name is required'),
  city: z.string().min(1, 'City is required'),
  starting_price: z.coerce.number().min(0, 'Price cannot be a negative value'),
  venue_lat: z.number().min(-90).max(90),
  venue_lng: z.number().min(-180).max(180),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
  initialData?: Partial<EventFormValues> & { id?: string; image_url?: string }
  onSubmitSuccess: (data: any) => void
}

export default function EventForm({ initialData, onSubmitSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [bannerUrl, setBannerUrl] = useState(initialData?.image_url || '')

  const isEditMode = !!initialData?.id

  // 2. Initialize React Hook Form with Zod tracking resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || 'Technology',
      date: initialData?.date || '',
      time: initialData?.time || '',
      venue: initialData?.venue || '',
      city: initialData?.city || 'San Francisco',
      starting_price: initialData?.starting_price || 0,
      venue_lat: initialData?.venue_lat || 37.7749,
      venue_lng: initialData?.venue_lng || -122.4194,
    },
  })

  // 3. Supabase Storage Upload Implementation Mockup
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setIsSubmitting(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `banners/${fileName}`

      console.log(`--- Uploading File to Supabase Storage ---`)
      console.log(`Target Bucket: event-images`, filePath)

      // Simulated asset return public URL
      const simulatedPublicUrl = URL.createObjectURL(file)
      setBannerUrl(simulatedPublicUrl)
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image file asset.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Form Submission Handler
  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true)
    const payload = { ...values, image_url: bannerUrl }

    console.log(`--- Form Submission Triggered [${isEditMode ? 'EDIT' : 'ADD'}] ---`, payload)

    // Simulate standard operational API update delay hooks
    await new Promise((r) => setTimeout(r, 1000))
    
    setIsSubmitting(false)
    onSubmitSuccess(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-3xl mx-auto bg-white p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 rounded-xl shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {isEditMode ? 'Edit Dynamic Event' : 'Create New Event Platform Payload'}
        </h2>
        <p className="text-xs text-zinc-500">
          Configure core architectural layout specifications mapping to the global discovery matrix grid.
        </p>
      </div>

      <hr className="border-zinc-100 dark:border-zinc-800" />

      {/* Title Field input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Event Title</label>
        <input 
          type="text" 
          placeholder="e.g., Extended Reality Developer Convention 2026"
          {...register('title')} 
          className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {errors.title && <span className="text-[11px] font-medium text-red-500">{errors.title.message}</span>}
      </div>

      {/* Description Field Input Area */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Detailed Description</label>
        <textarea 
          rows={4}
          placeholder="Provide a deep technical runtime summary payload..."
          {...register('description')} 
          className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {errors.description && <span className="text-[11px] font-medium text-red-500">{errors.description.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Choice */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Category Tag</label>
          <select 
            {...register('category')}
            className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none cursor-pointer"
          >
            <option value="Technology">Technology</option>
            <option value="Music">Music</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        {/* Date Selector input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Event Date</label>
          <input type="date" {...register('date')} className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none" />
          {errors.date && <span className="text-[11px] font-medium text-red-500">{errors.date.message}</span>}
        </div>

        {/* Time Selector Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Starting Time</label>
          <input type="time" {...register('time')} className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none" />
          {errors.time && <span className="text-[11px] font-medium text-red-500">{errors.time.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Venue Address string */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Venue Address / Center Name</label>
          <input type="text" placeholder="e.g., Building 4, Tech Hub Complex" {...register('venue')} className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none" />
          {errors.venue && <span className="text-[11px] font-medium text-red-500">{errors.venue.message}</span>}
        </div>

        {/* City Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">City</label>
          <input type="text" placeholder="e.g., San Francisco" {...register('city')} className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none" />
          {errors.city && <span className="text-[11px] font-medium text-red-500">{errors.city.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Ticketing Cost */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Starting Ticket Price ($)</label>
          <input type="number" step="any" {...register('starting_price')} className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-800 focus:outline-none" />
          {errors.starting_price && <span className="text-[11px] font-medium text-red-500">{errors.starting_price.message}</span>}
        </div>

        {/* Latitude hidden input tracking */}
        <input type="hidden" {...register('venue_lat', { valueAsNumber: true })} />
        {/* Longitude hidden input tracking */}
        <input type="hidden" {...register('venue_lng', { valueAsNumber: true })} />
      </div>

      {/* Image Banner Asset Bucket Upload Handler */}
      <div className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Event Cover Banner (Supabase Bucket Upload)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleBannerUpload}
          className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900 cursor-pointer"
        />
        {bannerUrl && (
          <div className="mt-2 aspect-[16/9] w-48 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
          </div>
        )}
        {uploadError && <span className="text-[11px] font-medium text-red-500">{uploadError}</span>}
      </div>

      {/* Submission Triggers */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button" 
          className="px-4 py-2 text-xs font-semibold text-zinc-600 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? 'Processing Network Streams...' : isEditMode ? 'Update Configuration' : 'Publish to Catalog'}
        </button>
      </div>
    </form>
  )
}