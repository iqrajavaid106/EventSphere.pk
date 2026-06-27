"use client"

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import moment from 'moment'

export default function OrganizerDashboard() {
  const { data: userObj, isLoading: isUserLoading } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()

  const { data: myEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: async () => {
      if (!user) return [] as any[]
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(name),
          tickets(id)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const roleName = (userObj as any)?.profile?.roles?.name
  const isOrganizerOrAdmin = roleName === 'organizer' || roleName === 'admin'
  const hasApprovedEvents = myEvents && myEvents.length > 0
  const isAuthorized = isOrganizerOrAdmin || hasApprovedEvents

  if (isUserLoading || isEventsLoading) {
    return <div className="p-12 text-center animate-pulse">Loading dashboard...</div>
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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {isOrganizerOrAdmin ? 'Organizer Portal' : 'Event Portal'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isOrganizerOrAdmin 
                ? 'Manage your events, scan tickets, and view analytics.' 
                : 'Manage your approved pitched event details, tickets, and check-ins.'}
            </p>
          </div>
          {isOrganizerOrAdmin && (
            <Link 
              href="/organizer/new" 
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              + Create New Event
            </Link>
          )}
        </div>

        {myEvents?.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center space-y-4 shadow-sm">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">No events found</h3>
            <p className="text-zinc-500 dark:text-zinc-400">You haven't hosted any events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents?.map(event => (
              <Card key={event.id} className="overflow-hidden hover:shadow-md transition-all border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
                <div className="relative h-40 bg-zinc-200 dark:bg-zinc-800">
                  {event.banner_url ? (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No Image</div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                      event.is_published ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {event.is_published ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
                
                <CardHeader className="p-4 pb-0 flex-none">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">{event.title}</h3>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                    {moment(event.start_date).format('MMM Do, YYYY')}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 flex-1 flex flex-col justify-end">
                  <div className="flex justify-between items-center text-sm mb-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-xs">Tickets Sold</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {((event.tickets as any)?.length || 0)} / {event.capacity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Link 
                      href={`/organizer/events/${event.id}/edit`}
                      className="text-center py-2 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-50 rounded-md transition-colors"
                    >
                      Edit Details
                    </Link>
                    <Link 
                      href={`/organizer/events/${event.id}/scanner`}
                      className="text-center py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-md transition-colors"
                    >
                      Scan QR
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
