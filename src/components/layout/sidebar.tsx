"use client"

import { motion } from 'framer-motion'
import { HomeIcon, PersonIcon, StarIcon, GearIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const menuItems = [
    { icon: HomeIcon, label: 'Dashboard', href: '/' },
    { icon: PersonIcon, label: 'Projects', href: '/projects' },
    { icon: StarIcon, label: 'Skills', href: '/skills' },
    { icon: GearIcon, label: 'Certifications', href: '/certifications' },
]

export function Sidebar() {
    return (
        <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen p-4"
        >
            <TooltipProvider delayDuration={0}>
                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <motion.a
                                    href={item.href}
                                    whileHover={{ scale: 1.05 }}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-lg",
                                        "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="truncate">{item.label}</span>
                                </motion.a>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
            </TooltipProvider>
        </motion.aside>
    )
} 