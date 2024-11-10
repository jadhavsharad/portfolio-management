"use client"

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Header() {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    // Only show theme switcher after mounting to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        try {
            await auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Failed to logout:', error)
        }
    }

    // Render a placeholder during SSR
    if (!mounted) {
        return (
            <header className="border-b p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Portfolio Manager</h1>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon">
                            <MoonIcon className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
        )
    }

    return (
        <header className="border-b p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">Portfolio Manager</h1>

                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="h-5 w-5" />
                        ) : (
                            <MoonIcon className="h-5 w-5" />
                        )}
                    </Button>

                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    )
} 