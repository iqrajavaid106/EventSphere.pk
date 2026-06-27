"use client"

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

export type EventWithDetails = Database['public']['Tables']['events']['Row'] & {
  event_categories?: { name: string } | null
}

interface UseEventsOptions {
  categoryId?: number
  search?: string
  limit?: number
}

export function useEvents(options?: UseEventsOptions) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['events', options],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          event_categories(name)
        `)
        .eq('is_published', true)
        .order('start_date', { ascending: true })

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }

      if (options?.search) {
        query = query.ilike('title', `%${options.search}%`)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data as EventWithDetails[]
    },
  })
}
