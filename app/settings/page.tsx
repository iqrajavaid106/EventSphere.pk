"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { data: userObj, isLoading } = useUser()
  const user = userObj?.id ? userObj : null
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [favoriteGenre, setFavoriteGenre] = useState('')
  const [defaultCity, setDefaultCity] = useState('')
  const [searchRadius, setSearchRadius] = useState('25')
  const [roleId, setRoleId] = useState<number>(3)
  const [isSaving, setIsSaving] = useState(false)

  // Upgrade Request States
  const [requestBusinessName, setRequestBusinessName] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const roleName = (userObj as any)?.profile?.roles?.name

  // Fetch upgrade request status for Attendees
  const { data: upgradeRequest, refetch: refetchUpgradeRequest } = useQuery<any>({
    queryKey: ['my-upgrade-request', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('business_requests')
        .select('*')
        .eq('profile_id', user.id)
      if (error) throw error
      // Filter out event pitches (which contain 'Proposed Date:')
      const roleRequest = data?.find((r: any) => !(r.tax_id_or_notes || '').includes('Proposed Date:'))
      return roleRequest || null
    },
    enabled: !!user && roleName === 'attendee'
  })

  const handleRequestOrganizer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !requestBusinessName.trim()) return
    setIsSubmittingRequest(true)

    try {
      const businessTable = supabase.from('business_requests') as any
      const { error } = await businessTable.insert({
        profile_id: user.id,
        business_name: requestBusinessName.trim(),
        tax_id_or_notes: `Description/Pitch: ${requestNotes.trim()}`,
        status: 'pending'
      })

      if (error) throw error
      alert('Organizer request submitted successfully!')
      refetchUpgradeRequest()
    } catch (err: any) {
      alert('Failed to submit request: ' + err.message)
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // Initialize from DB
  useEffect(() => {
    if ((user as any)?.profile) {
      const profile = (user as any).profile
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
      setRoleId(profile.role_id || 3)
      
      const prefs = profile.preferences || {}
      setFavoriteGenre(prefs.favorite_genre || '')
      setDefaultCity(prefs.default_city || '')
      setSearchRadius(prefs.search_radius || '25')
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)

    const preferences = {
      favorite_genre: favoriteGenre,
      default_city: defaultCity,
      search_radius: searchRadius
    }

    try {
      const profilesTable = supabase.from('profiles') as any
      
      const updateData: any = {
        full_name: fullName,
        avatar_url: avatarUrl
      }

      if (roleName === 'attendee') {
        updateData.preferences = preferences
      }

      const { error } = await profilesTable
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['user'] })
      alert('Profile details updated successfully!')
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-12 text-center animate-pulse">Loading settings...</div>
  if (!user) return <div className="p-12 text-center">Please log in to view settings.</div>

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Profile & Preferences</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your identity and hyper-local search preferences.</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Update your public profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                  <Input id="avatarUrl" type="url" placeholder="https://example.com/avatar.jpg" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Account Role</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-500">Current Role:</span>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                    roleName === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    roleName === 'organizer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {roleName || 'Attendee'}
                  </span>
                </div>
              </div>

              {roleName === 'attendee' && (
                <>
                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Organizer Account Request</h3>
                    
                    {upgradeRequest ? (
                      <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <p className="text-sm">
                          <strong>Organization:</strong> {upgradeRequest.business_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <strong>Request Status:</strong>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            upgradeRequest.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            upgradeRequest.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {upgradeRequest.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reqBusinessName">Business / Organization Name</Label>
                          <Input 
                            id="reqBusinessName" 
                            placeholder="e.g. My Event Ventures LLC"
                            value={requestBusinessName}
                            onChange={(e) => setRequestBusinessName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reqNotes">Event Description & Logistics Notes</Label>
                          <textarea 
                            id="reqNotes" 
                            rows={3}
                            placeholder="What types of events do you plan to create?"
                            className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-400"
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRequestOrganizer}
                          disabled={isSubmittingRequest || !requestBusinessName.trim()}
                          className="w-full py-2 text-sm font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                        >
                          {isSubmittingRequest ? 'Submitting...' : 'Request Organizer Role'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-zinc-50">Hyper-Local Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="favoriteGenre">Favorite Event Genre</Label>
                        <select 
                          id="favoriteGenre"
                          value={favoriteGenre} 
                          onChange={(e) => setFavoriteGenre(e.target.value)}
                          className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:focus:ring-zinc-300"
                        >
                          <option value="">No Preference</option>
                          <option value="Technology">Technology</option>
                          <option value="Music">Music</option>
                          <option value="Sports">Sports</option>
                          <option value="Art">Art</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultCity">Default City Boundary</Label>
                        <select 
                          id="defaultCity"
                          value={defaultCity} 
                          onChange={(e) => setDefaultCity(e.target.value)}
                          className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:focus:ring-zinc-300"
                        >
                          <option value="">Use GPS Default</option>
                          <option value="New York">New York</option>
                          <option value="San Francisco">San Francisco</option>
                          <option value="London">London</option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="searchRadius">Proximity Search Radius ({searchRadius} miles)</Label>
                        <input 
                          id="searchRadius"
                          type="range" 
                          min="5" 
                          max="100" 
                          step="5"
                          value={searchRadius} 
                          onChange={(e) => setSearchRadius(e.target.value)}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
