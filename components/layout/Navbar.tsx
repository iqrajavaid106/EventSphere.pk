import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Navbar() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  let roleName = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()
    if (profile?.roles) {
      roleName = (profile.roles as any).name
    }
  }

  // Only display sub-navbar for Organizers (hide for Admin and Attendee to prevent duplicates)
  if (roleName !== 'organizer') {
    return null
  }

  return (
    <nav className="w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-2">
      <div className="mx-auto max-w-7xl px-6 flex items-center gap-4 overflow-x-auto scrollbar-none text-xs font-medium">
        <Link
          href="/organizer/new"
          className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 white-space-nowrap transition-colors py-1 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Create Event
        </Link>
      </div>
    </nav>
  )
}