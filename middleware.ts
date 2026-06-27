// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Initialize Supabase Client for Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  // 2. Refresh session if it exists/expired
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 3. Define Protected Routes
  const isProtectedRoute = 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/organizer') || 
    url.pathname.startsWith('/admin')

  // 4. Redirect Rules
  if (isProtectedRoute && !user) {
    // User is trying to access protected pages but isn't logged in -> send to login
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (url.pathname.startsWith('/login') && user) {
    // User is already logged in but trying to view the login page -> send to dashboard
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

// 5. Optimize Middleware Performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default middleware;
