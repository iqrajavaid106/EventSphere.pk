"use client"

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import moment from 'moment'
import TicketQR from '@/components/features/TicketQR'
import FeedbackForm from '@/components/features/FeedbackForm'

export default function DashboardPage() {
  const { data: userObj, isLoading: isUserLoading } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()
  const isAdmin = (userObj as any)?.profile?.roles?.name === 'admin'

  // Fetch tickets (all tickets for admin, own tickets for normal user)
  const { data: tickets, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['my-tickets', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [] as any[]
      let query = supabase
        .from('tickets')
        .select(`
          *,
          profiles(full_name, avatar_url),
          events(*, event_categories(name))
        `)
      
      if (!isAdmin) {
        query = query.eq('profile_id', user.id)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // Fetch all system events (only for Admin)
  const { data: allEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['admin-all-system-events', user?.id],
    queryFn: async () => {
      if (!isAdmin) return [] as any[]
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_categories(name),
          profiles:organizer_id(full_name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user && isAdmin
  })

  if (isUserLoading || isTicketsLoading || (isAdmin && isEventsLoading)) {
    return <div className="p-12 text-center animate-pulse">Loading Dashboard...</div>
  }

  if (!user) {
    return <div className="p-12 text-center text-zinc-500">Please log in to view your dashboard.</div>
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {isAdmin ? 'System Ticket & Event Ledger' : 'My Tickets'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAdmin 
              ? 'Global administrative overview of all issued tickets and system events.' 
              : 'View and manage your upcoming events.'
            }
          </p>
        </div>

        {isAdmin ? (
          <div className="space-y-12">
            {/* Global Tickets Table */}
            <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">All Issued Tickets ({tickets?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-3 font-medium">Ticket ID</th>
                        <th className="px-6 py-3 font-medium">Event Name</th>
                        <th className="px-6 py-3 font-medium">Attendee</th>
                        <th className="px-6 py-3 font-medium">Tier</th>
                        <th className="px-6 py-3 font-medium">Price</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Issued Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {tickets?.map((ticket) => {
                        const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
                        return (
                          <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-zinc-500">{ticket.id}</td>
                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{event?.title || 'N/A'}</td>
                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{ticket.profiles?.full_name || 'Anonymous'}</td>
                            <td className="px-6 py-4 capitalize text-zinc-500 dark:text-zinc-400">{ticket.ticket_type}</td>
                            <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-semibold">${ticket.price}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                ticket.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                ticket.status === 'used' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{moment(ticket.created_at).format('MMM D, YYYY')}</td>
                          </tr>
                        )
                      })}
                      {(!tickets || tickets.length === 0) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">No tickets have been issued yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Global Events Management */}
            <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">All System Events ({allEvents?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-3 font-medium">Event Name</th>
                        <th className="px-6 py-3 font-medium">Organizer</th>
                        <th className="px-6 py-3 font-medium">Category</th>
                        <th className="px-6 py-3 font-medium">Proposed Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {allEvents?.map((event) => (
                        <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{event.title}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{event.profiles?.full_name || 'N/A'}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{event.event_categories?.name || 'Uncategorized'}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{moment(event.start_date).format('MMM D, YYYY')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                              event.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {event.is_published ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/organizer/events/${event.id}/edit`}
                              className="inline-flex rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                            >
                              Edit Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {(!allEvents || allEvents.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">No events found in system database.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Normal User Tickets View */
          <div>
            {tickets?.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center space-y-4">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">No tickets yet!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Start exploring events nearby.</p>
                <Link href="/" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets?.map(ticket => {
                  const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
                  if (!event) return null
                  
                  return (
                    <Card key={ticket.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row h-full">
                        {/* QR Code Placeholder / Image */}
                        <div className="w-full md:w-[180px] bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                          <div className="w-32 h-32 bg-white p-2 rounded-lg shadow-sm mb-2 flex items-center justify-center">
                            <TicketQR data={ticket.qr_code_data || ticket.id} />
                          </div>
                          <span className="text-xs font-mono text-zinc-500 break-all text-center">{ticket.id.split('-')[0]}</span>
                        </div>

                        {/* Details */}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            {moment(event.start_date).format('MMM Do, h:mm A')}
                          </div>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-tight mb-2">
                            {event.title}
                          </h3>
                          <div className="text-sm text-zinc-500 mb-4 flex-1">
                            📍 {event.location_name || 'Online'}
                          </div>
                          <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300 capitalize">{ticket.ticket_type}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              ticket.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              ticket.status === 'used' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          {moment(event.end_date || event.start_date).isBefore(moment()) && (
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                              <FeedbackForm eventId={event.id} userId={user.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
