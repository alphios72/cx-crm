"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Settings, LogOut, Search, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { useState } from "react"

const baseNavigation = [
    { name: "Pipeline", href: "/dashboard", icon: LayoutDashboard },
    { name: "Scadenziario", href: "/dashboard/schedule", icon: Calendar },
]

export function Topbar({ userRole }: { userRole?: string }) {
    const pathname = usePathname()
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const navigation = [...baseNavigation]
    if (userRole === "ADMIN") {
        navigation.push({ name: "Settings", href: "/dashboard/settings", icon: Settings })
    }

    return (
        <header className="sticky top-0 z-50 w-full flex h-14 bg-[#3b5998] text-white shadow-sm font-sans items-center px-4">
            {/* Logo Section */}
            <div className="flex h-14 shrink-0 items-center bg-white px-2 mr-4 border-r border-[#314a80]">
                <div className="relative h-8 w-24 flex items-center justify-center">
                    <Image
                        src="/conexo-logo.jpg"
                        alt="Conexo Logo"
                        width={96}
                        height={32}
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex h-full flex-1 items-center gap-1 overflow-x-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex h-full items-center px-4 text-sm font-medium transition-colors border-b-4",
                                isActive
                                    ? "bg-[#4264aa] text-white border-white"
                                    : "text-gray-200 hover:bg-[#4264aa] hover:text-white border-transparent"
                            )}
                        >
                            <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Right Section (Search, New Action, User Profile) */}
            <div className="flex items-center gap-4 shrink-0 lg:gap-6 ml-4">
                {/* Search Bar Placeholder */}
                <div className="hidden lg:flex relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Cercare..."
                        className="h-8 w-48 rounded-md bg-white px-8 text-sm text-gray-900 border-none outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                <div className="flex items-center gap-2 border-l border-[#4c6eb8] pl-4">
                    {/* User Profile Dropdown Placeholder / Sign out */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 hover:bg-[#4264aa] p-1.5 rounded-md transition-colors"
                        >
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs uppercase">
                                CX
                            </div>
                            <span className="text-sm font-medium hidden sm:inline-block">Profile</span>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <span className="block px-4 py-2 text-xs text-gray-500 uppercase font-semibold">Role: {userRole}</span>
                                <button
                                    onClick={() => signOut()}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                                >
                                    <LogOut className="inline-block mr-2 h-4 w-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
