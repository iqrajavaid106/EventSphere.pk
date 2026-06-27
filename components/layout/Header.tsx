// components/layout/Header.tsx
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Header() {
  const cookieStore = await cookies()
  
  // 1. Initialize Supabase to read server-side auth state
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
  let hasEvents = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()
    if (profile?.roles) {
      roleName = (profile.roles as any).name
    }
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', user.id)
    if (count && count > 0) {
      hasEvents = true
    }
  }

  // 2. Server Action to log out securely
  async function handleSignOut() {
    'use server'
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              )
            } catch {}
          },
        },
      }
    )
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Brand Logo */}
        <Link href={roleName === 'admin' ? '/dashboard' : (roleName === 'organizer' || hasEvents) ? '/organizer' : '/'} className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
          <span>EventSphere <span className="text-blue-600 dark:text-blue-400">AI</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {(roleName === 'attendee' || roleName === '') && (
            <>
              <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Browse Events</Link>
              {roleName !== 'attendee' && (
                <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Pricing</Link>
              )}
              <Link href="/pitch" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Pitch Event</Link>
            </>
          )}
        </nav>

        {/* Dynamic Auth Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Show Admin Portal link to Admins */}
              {roleName === 'admin' && (
                <>
                  <Link 
                    href="/admin" 
                    className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Admin Portal
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {/* Show Organizer Portal link to Organizers, or Event Portal for attendees with approved events */}
              {roleName === 'organizer' && (
                <Link 
                  href="/organizer" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Organizer Portal
                </Link>
              )}
              {roleName === 'attendee' && hasEvents && (
                <Link 
                  href="/organizer" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Event Portal
                </Link>
              )}

              {/* Show Dashboard link to Attendees */}
              {roleName === 'attendee' && (
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              
              <form action={handleSignOut} className="inline-flex items-center gap-4">
                <Link href="/settings" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">Settings</Link>
                <button 
                  type="submit" 
                  className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}