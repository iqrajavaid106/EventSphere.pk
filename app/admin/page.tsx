"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import moment from 'moment'
import { useState } from 'react'
import { LayoutDashboard, Calendar, UserCheck, Lightbulb } from 'lucide-react'

interface ProfileRelation {
    full_name: string | null
}

interface PitchRequest {
    id: string
    profile_id: string
    business_name: string
    tax_id_or_notes: string | null
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    profiles: ProfileRelation | null
}

interface EventModerationItem {
    id: string
    title: string
    is_published: boolean
    created_at: string
    profiles: ProfileRelation | null
}

export default function AdminDashboard() {
    const { data: userObj, isLoading: isUserLoading } = useUser()
    const user = userObj?.id ? userObj : null
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [selectedPitch, setSelectedPitch] = useState<PitchRequest | null>(null)
    const [activeMenu, setActiveMenu] = useState<'overview' | 'moderation' | 'organizers' | 'pitches'>('overview')

    // Fetch basic system stats
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [usersRes, eventsRes, ticketsRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('events').select('id', { count: 'exact', head: true }),
                supabase.from('tickets').select('id', { count: 'exact', head: true })
            ])
            return {
                totalUsers: usersRes.count || 0,
                totalEvents: eventsRes.count || 0,
                totalTickets: ticketsRes.count || 0,
            }
        },
        enabled: !!user
    })

    // Fetch pending business pitches
    const { data: businessPitches } = useQuery<PitchRequest[]>({
        queryKey: ['admin-business-pitches'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_requests')
                .select('*, profiles:profile_id(full_name)')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data as unknown as PitchRequest[]
        },
        enabled: !!user
    })

    // Filter into organizer role requests and event pitches
    const roleRequests = businessPitches?.filter((pitch) => !(pitch.tax_id_or_notes || '').includes('Proposed Date:')) || []
    const eventPitches = businessPitches?.filter((pitch) => (pitch.tax_id_or_notes || '').includes('Proposed Date:')) || []

    // Fetch recent events for moderation
    const { data: recentEvents } = useQuery<EventModerationItem[]>({
        queryKey: ['admin-recent-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('id, title, is_published, created_at, profiles:organizer_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(20)
            if (error) throw error
            return data as unknown as EventModerationItem[]
        },
        enabled: !!user
    })

    const pendingEventsCount = recentEvents?.filter((e) => !e.is_published).length || 0
    const pendingRoleRequestsCount = roleRequests?.filter((r) => r.status === 'pending').length || 0
    const pendingPitchesCount = eventPitches?.filter((p) => p.status === 'pending').length || 0

    const handleTogglePublish = async (eventId: string, publish: boolean) => {
        setUpdatingId(eventId)
        try {
            const { error } = await supabase
                .from('events')
                .update({ is_published: publish })
                .eq('id', eventId)

            if (error) throw error
            alert(`Event ${publish ? 'approved & published' : 'unpublished'} successfully!`)
            queryClient.invalidateQueries({ queryKey: ['admin-recent-events'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        } catch (err: any) {
            alert('Action failed: ' + err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    const handlePitchAction = async (pitchId: string, profileId: string, approve: boolean) => {
        try {
            const { error: pitchError } = await supabase
                .from('business_requests')
                .update({ status: approve ? 'approved' : 'rejected' })
                .eq('id', pitchId)

            if (pitchError) throw pitchError

            const pitch = businessPitches?.find((p) => p.id === pitchId)
            const notes = pitch?.tax_id_or_notes || ''
            const isPitch = notes.includes('Proposed Date:')

            if (approve) {
                if (isPitch) {
                    if (pitch) {
                        let proposedDateStr = ''
                        let description = ''

                        const dateMatch = notes.match(/Proposed Date:\s*([^\n|]+)/)
                        if (dateMatch) proposedDateStr = dateMatch[1].trim()

                        const descMatch = notes.match(/Description:\s*([\s\S]+)/)
                        if (descMatch) description = descMatch[1].trim()

                        const startDate = proposedDateStr ? new Date(proposedDateStr) : new Date()
                        const validStartDate = isNaN(startDate.getTime()) ? new Date() : startDate
                        const validEndDate = new Date(validStartDate.getTime() + 2 * 60 * 60 * 1000)

                        const { error: eventError } = await supabase
                            .from('events')
                            .insert({
                                organizer_id: profileId,
                                title: pitch.business_name,
                                description: description || pitch.business_name,
                                location_name: 'Venue TBD',
                                city: 'New York',
                                start_date: validStartDate.toISOString(),
                                end_date: validEndDate.toISOString(),
                                capacity: 100,
                                is_published: true,
                                ticket_tiers: [
                                    { name: 'Regular', price: 50 },
                                    { name: 'VIP', price: 150 },
                                    { name: 'Student', price: 25 }
                                ]
                            })
                        if (eventError) throw eventError
                    }
                } else {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ role_id: 2 })
                        .eq('id', profileId)
                    if (profileError) throw profileError
                }
            } else {
                if (isPitch) {
                    if (pitch) {
                        await supabase
                            .from('events')
                            .delete()
                            .eq('organizer_id', profileId)
                            .eq('title', pitch.business_name)
                    }
                } else {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ role_id: 3 })
                        .eq('id', profileId)
                    if (profileError) throw profileError
                }
            }

            const alertMessage = isPitch
                ? `Event pitch ${approve ? 'approved and event created' : 'rejected/retracted and event removed'} successfully!`
                : `Organizer role request ${approve ? 'approved' : 'rejected/retracted'} successfully!`
            alert(alertMessage)

            queryClient.invalidateQueries({ queryKey: ['admin-business-pitches'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        } catch (err: any) {
            alert('Action failed: ' + err.message)
        }
    }

    if (isUserLoading) {
        return <div className="p-12 text-center animate-pulse">Loading Admin Portal...</div>
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
                <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 text-center max-w-md w-full shadow-sm">
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-sm">You must be a system administrator to view this page.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 animate-fade-in-down">
            <div className="mx-auto max-w-7xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">System Administration</h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Platform overview, moderation, and analytics.</p>
                </div>

                {/* Navigation Tabs Menu */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-8 overflow-x-auto scrollbar-none pb-px">
                    <button
                        onClick={() => setActiveMenu('overview')}
                        className={`flex items-center gap-2 pb-4 pt-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeMenu === 'overview'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </button>

                    <button
                        onClick={() => setActiveMenu('moderation')}
                        className={`flex items-center gap-2 pb-4 pt-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap relative ${activeMenu === 'moderation'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Event Moderation
                        {pendingEventsCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                                {pendingEventsCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveMenu('organizers')}
                        className={`flex items-center gap-2 pb-4 pt-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap relative ${activeMenu === 'organizers'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                            }`}
                    >
                        <UserCheck className="h-4 w-4" />
                        Organizer Requests
                        {pendingRoleRequestsCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full animate-pulse">
                                {pendingRoleRequestsCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveMenu('pitches')}
                        className={`flex items-center gap-2 pb-4 pt-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap relative ${activeMenu === 'pitches'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50'
                            }`}
                    >
                        <Lightbulb className="h-4 w-4" />
                        Event Pitches
                        {pendingPitchesCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full animate-pulse">
                                {pendingPitchesCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab Content Panels */}
                {activeMenu === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Users</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats?.totalUsers || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Events Created</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats?.totalEvents || 0}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tickets Sold</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats?.totalTickets || 0}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Admin Quick Reference</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                                <p>Welcome to the System Administration Panel. Below is an overview of platform functionalities accessible via the top menus:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong className="text-zinc-900 dark:text-zinc-50">Event Moderation:</strong> Approve or unpublish user-created events. Published events are visible in public listings immediately.
                                    </li>
                                    <li>
                                        <strong className="text-zinc-900 dark:text-zinc-50">Organizer Requests:</strong> Upgrade Attendee accounts to Organizer status when they request it via their Settings panel.
                                    </li>
                                    <li>
                                        <strong className="text-zinc-900 dark:text-zinc-50">Event Pitches:</strong> Approve prospective event proposals submitted by attendees. Approving a pitch auto-creates a published event on behalf of the user, without elevating their role profile.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeMenu === 'moderation' && (
                    <div className="animate-fade-in">
                        <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Events (Moderation Queue)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Event Name</th>
                                                <th className="px-6 py-3 font-medium">Organizer</th>
                                                <th className="px-6 py-3 font-medium">Created Date</th>
                                                <th className="px-6 py-3 font-medium">Status</th>
                                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                                            </tr>
                                    </table>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {recentEvents?.map((event) => (
                                            <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{event.title}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{event.profiles?.full_name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{moment(event.created_at).format('MMM D, YYYY')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${event.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {event.is_published ? 'Published' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    {event.is_published ? (
                                                        <button
                                                            onClick={() => handleTogglePublish(event.id, false)}
                                                            disabled={updatingId === event.id}
                                                            className="rounded bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 transition-colors disabled:opacity-50"
                                                        >
                                                            Unpublish
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTogglePublish(event.id, true)}
                                                            disabled={updatingId === event.id}
                                                            className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!recentEvents || recentEvents.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                                                    No recent events found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    </div>
                )}

            {activeMenu === 'organizers' && (
                <div className="animate-fade-in">
                    <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Organizer Upgrade Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Business/Org Name</th>
                                            <th className="px-6 py-3 font-medium">Requested By</th>
                                            <th className="px-6 py-3 font-medium">Logistics/Notes</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {roleRequests?.map((req) => (
                                            <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{req.business_name}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{req.profiles?.full_name || 'Unknown User'}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 max-w-[300px] truncate">
                                                    {(req.tax_id_or_notes || '').replace('Description/Pitch:', '').trim()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button onClick={() => setSelectedPitch(req)} className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 transition-colors">View Details</button>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handlePitchAction(req.id, req.profile_id, true)} className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">Approve Request</button>
                                                            <button onClick={() => handlePitchAction(req.id, req.profile_id, false)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">Reject Request</button>
                                                        </>
                                                    )}
                                                    {req.status === 'approved' && (
                                                        <button onClick={() => handlePitchAction(req.id, req.profile_id, false)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">Reject & Downgrade</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!roleRequests || roleRequests.length === 0) && (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">No organizer upgrade requests found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeMenu === 'pitches' && (
                <div className="animate-fade-in">
                    <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Business Event Pitches</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Event/Business Name</th>
                                            <th className="px-6 py-3 font-medium">Contact Person</th>
                                            <th className="px-6 py-3 font-medium">Proposed Date</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {eventPitches?.map((pitch) => (
                                            <tr key={pitch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{pitch.business_name}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{pitch.profiles?.full_name || 'Unknown User'}</td>
                                                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                                    {(() => {
                                                        const dateMatch = (pitch.tax_id_or_notes || '').match(/Proposed Date:\s*([^\n|]+)/)
                                                        return dateMatch ? dateMatch[1].trim() : 'N/A'
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${pitch.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : pitch.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {pitch.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button onClick={() => setSelectedPitch(pitch)} className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 transition-colors">View Details</button>
                                                    {pitch.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handlePitchAction(pitch.id, pitch.profile_id, true)} className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">Approve Pitch</button>
                                                            <button onClick={() => handlePitchAction(pitch.id, pitch.profile_id, false)} className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">Reject Pitch</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!eventPitches || eventPitches.length === 0) && (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">No business event pitches found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
        </div >
    )
}