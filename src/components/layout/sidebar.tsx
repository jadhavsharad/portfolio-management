"use client"

import { motion } from 'framer-motion'
import { HomeIcon, PersonIcon, StarIcon, GearIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { CodeIcon, ChevronRightIcon, SparklesIcon, CircleIcon, HeartIcon, FileIcon, MenuIcon, XIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

const menuItems = [
    {
        icon: HomeIcon,
        label: 'Dashboard',
        href: '/',
        gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        hoverColor: 'hover:text-purple-600 dark:hover:text-purple-400'
    },
    {
        icon: PersonIcon,
        label: 'Projects',
        href: '/projects',
        gradient: 'from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10',
        hoverColor: 'hover:text-red-600 dark:hover:text-red-400'
    },
    {
        icon: StarIcon,
        label: 'Skills',
        href: '/skills',
        gradient: 'from-teal-100 to-teal-50 dark:from-teal-900/20 dark:to-teal-900/10',
        hoverColor: 'hover:text-teal-600 dark:hover:text-teal-400'
    },
    {
        icon: GearIcon,
        label: 'Certifications',
        href: '/certifications',
        gradient: 'from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10',
        hoverColor: 'hover:text-blue-600 dark:hover:text-blue-400'
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setIsOpen(true)
            }
        }

        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    return (
        <>
            {/* Update mobile menu button positioning */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-3.5 left-4 z-50 md:hidden bg-background hover:bg-accent p-2 rounded-lg transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
            >
                {isOpen ? 
                    <XIcon className="h-5 w-5" /> : 
                    <MenuIcon className="h-5 w-5" />
                }
            </button>

            <div className={cn(
                "w-64 flex-shrink-0",
                !isOpen && "hidden md:block",
                isMobile && "absolute inset-0 z-40"
            )}>
                <motion.aside
                    initial={false}
                    animate={{ x: isOpen ? 0 : -256 }}
                    transition={{ duration: 0.2 }}
                    className="fixed w-64 bg-zinc-50 dark:bg-zinc-950 border-r min-h-screen p-4"
                    aria-label="Main Navigation"
                >
                    <div className="h-[50px] flex items-center gap-2 px-2" aria-label="Portfolio Header">
                        <SparklesIcon className="h-4 w-4 text-purple-500" aria-hidden="true" />
                        <h2 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Portfolio Manager</h2>
                    </div>

                    <nav className="space-y-1.5 py-4" role="navigation">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => isMobile && setIsOpen(false)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-2 rounded-full transition-colors duration-200",
                                            "hover:bg-gradient-to-r", item.gradient, item.hoverColor,
                                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                                            "group",
                                            isActive ? `bg-gradient-to-r ${item.gradient} font-medium` : ""
                                        )}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`${item.label} ${isActive ? '(current page)' : ''}`}
                                    >
                                        <span className="flex items-center gap-2.5" aria-hidden="true">
                                            <item.icon className={cn(
                                                "h-3.5 w-3.5 transition-colors",
                                                isActive && "text-primary"
                                            )} />
                                            <FileIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </span>
                                        <span className={cn(
                                            "text-sm flex-grow",
                                            isActive && "text-primary"
                                        )}>{item.label}</span>
                                        {isActive && (
                                            <span className="flex items-center gap-1" aria-hidden="true">
                                                <CircleIcon className="h-1.5 w-1.5 text-primary" />
                                                <ChevronRightIcon className="h-3 w-3 text-primary" />
                                            </span>
                                        )}
                                    </motion.div>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-md p-3 flex items-center justify-center gap-1.5"
                            role="contentinfo"
                            aria-label="Version Information">
                            <CodeIcon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <HeartIcon className="h-2.5 w-2.5 text-red-400" aria-hidden="true" />
                            <p className="text-[10px] text-muted-foreground">
                                Portfolio v1.0
                            </p>
                        </div>
                    </div>
                </motion.aside>
            </div>

            {/* Overlay for mobile */}
            {isOpen && isMobile && (
                <div 
                    className="fixed inset-0 bg-black/40 z-30"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    )
}