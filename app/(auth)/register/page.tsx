// src/app/(auth)/register/page.tsx
import Link from 'next/link'
import { signUpWithEmail } from '../actions'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Get started with EventSphere AI</p>
        </div>

        {params.error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{params.error}</div>}

        <form action={signUpWithEmail} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full mt-1 px-3 py-2 border rounded-md bg-transparent" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input name="password" type="password" required className="w-full mt-1 px-3 py-2 border rounded-md bg-transparent" />
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white py-2 rounded-md hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account? <Link href="/login" className="underline font-medium text-zinc-900 dark:text-zinc-50">Log in</Link>
        </p>
      </div>
    </div>
  )
}