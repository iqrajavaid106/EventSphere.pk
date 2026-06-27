"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const pitchSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  contact_email: z.string().email('Invalid email address'),
  event_description: z.string().min(20, 'Please provide more details about the event'),
  proposed_date: z.string().nonempty('Proposed date is required')
})

type PitchFormValues = z.infer<typeof pitchSchema>

export default function BusinessPitchPage() {
  const router = useRouter()
  const supabase = createClient()
  const { data: userObj } = useUser()
  const user = userObj?.id ? userObj : null
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PitchFormValues>({
    resolver: zodResolver(pitchSchema)
  })

  const onSubmit = async (data: PitchFormValues) => {
    if (!user) {
      alert('You must be logged in to submit a pitch.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const businessTable = supabase.from('business_requests') as any
      
      // Concatenate the contact info and description into the tax_id_or_notes column
      const notes = `Email: ${data.contact_email} | Proposed Date: ${new Date(data.proposed_date).toLocaleString()}\n\nDescription: ${data.event_description}`
      
      const { error } = await businessTable.insert({
        profile_id: user.id,
        business_name: data.business_name,
        tax_id_or_notes: notes,
        status: 'pending'
      })
        
      if (error) throw error
      
      setSuccess(true)
    } catch (err: any) {
      alert('Failed to submit pitch: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <Card className="max-w-md w-full text-center p-6 border-zinc-200 dark:border-zinc-800">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Log In Required</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Please sign in to submit a business event pitch.</p>
            <button 
              onClick={() => router.push('/login')} 
              className="w-full py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Pitch Your Event</h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Local business? Submit your event proposal directly to the EventSphere moderation team to get featured on our discovery grid.
          </p>
        </div>

        {success ? (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">Pitch Submitted Successfully!</h2>
              <p className="text-green-700 dark:text-green-400 mb-6">Our administrators will review your proposal and reach out via email shortly.</p>
              <button onClick={() => router.push('/')} className="text-sm font-medium underline text-green-800 dark:text-green-200">Return Home</button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-zinc-900 shadow-xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Tell us about your venture and the event you'd like to host.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business / Organization Name</Label>
                    <Input id="business_name" placeholder="e.g. The Coffee House" {...register('business_name')} />
                    {errors.business_name && <p className="text-red-500 text-xs">{errors.business_name.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input id="contact_email" type="email" placeholder="contact@business.com" {...register('contact_email')} />
                    {errors.contact_email && <p className="text-red-500 text-xs">{errors.contact_email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_description">Event Description & Logistics</Label>
                  <textarea 
                    id="event_description" 
                    rows={5}
                    placeholder="Describe what the event is, expected audience, and any logistical needs..."
                    className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                    {...register('event_description')} 
                  />
                  {errors.event_description && <p className="text-red-500 text-xs">{errors.event_description.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposed_date">Proposed Event Date</Label>
                  <Input id="proposed_date" type="datetime-local" {...register('proposed_date')} />
                  {errors.proposed_date && <p className="text-red-500 text-xs">{errors.proposed_date.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 mt-4 text-sm font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Event Pitch'}
                </button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
