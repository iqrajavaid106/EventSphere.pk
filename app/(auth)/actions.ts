// src/app/(auth)/actions.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }))
          } catch {}
        },
      },
    }
  )
}

export async function loginWithEmail(formData: FormData) {
  const supabase = await getSupabaseClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    let msg = error.message
    if (msg === '{}' || !msg) {
      msg = 'Authentication failed. Please verify your Supabase database triggers/schema.'
    }
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }
  
  redirect('/dashboard')
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await getSupabaseClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback` }
  })
  
  if (error) {
    let msg = error.message
    if (msg === '{}' || !msg) {
      msg = 'Database error saving user. Please ensure the public.handle_new_user trigger function and profiles table exist and match.'
    }
    redirect(`/register?error=${encodeURIComponent(msg)}`)
  }
  
  redirect('/login?message=Check your email to confirm your account.')
}

export async function loginWithGoogle() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    let msg = error.message
    if (msg === '{}' || !msg) {
      msg = 'Google OAuth setup failed. Please check your Supabase dashboard configurations.'
    }
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }
  if (data.url) redirect(data.url) // Redirect straight to Google's sign-in portal
}