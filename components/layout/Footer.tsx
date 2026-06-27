// components/layout/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        
        {/* Copyright branding */}
        <div>
          <p>&copy; {currentYear} EventSphere AI. All rights reserved.</p>
        </div>

        {/* Dynamic Helpful Legal Links */}
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Contact Support
          </Link>
        </div>

      </div>
    </footer>
  )
}