"use client"

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: userObj, isLoading } = useUser()
    const router = useRouter()

    // Safely grab the role name from our newly typed profile object
    const roleName = userObj?.profile?.roles?.name?.toLowerCase()

    useEffect(() => {
        // If loading is done and user is either not logged in or not an admin, boot them to home
        if (!isLoading) {
            if (!userObj || roleName !== 'admin') {
                router.push('/')
            }
        }
    }, [userObj, roleName, isLoading, router])

    if (isLoading) {
        return (
            <div className= "flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950" >
            <div className="text-center animate-pulse text-zinc-500" > Verifying admin credentials...</div>
                </div>
    )
    }

    // If they are an admin, render the portal perfectly!
    if (userObj && roleName === 'admin') {
        return <>{ children } </>
    }

    return null
}