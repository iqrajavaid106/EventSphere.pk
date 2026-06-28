"use client"

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!user) return null

      // Also fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles:roles_id(name)')
        .eq('id', user.id)
        .single()

      return { ...user, profile }
    }
  })
}
