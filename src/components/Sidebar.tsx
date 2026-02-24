"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const baseNavigation = [
    { name: "Pipeline", href: "/dashboard", icon: LayoutDashboard },
    // { name: "Leads", href: "/dashboard/leads", icon: Users },
]

export function Sidebar({ userRole }: { userRole?: string }) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const navigation = [...baseNavigation]
    if (userRole === "ADMIN") {
        navigation.push({ name: "Settings", href: "/dashboard/settings", icon: Settings })
    }

    return (
        <div className={cn("flex flex-col h-full bg-gray-900 text-white transition-all duration-300 relative", isCollapsed ? "w-16" : "w-64")}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-gray-800 text-gray-300 hover:text-white p-1 rounded-full border border-gray-700 z-50 flex items-center justify-center transition-transform"
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className={cn("flex h-16 items-center font-bold text-xl tracking-wider", isCollapsed ? "justify-center px-0" : "px-6")}>
                {isCollapsed ? "cx" : "cx-crm"}
            </div>

            <nav className="flex-1 space-y-2 px-2 py-4 overflow-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                                isCollapsed ? "justify-center" : "px-4"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "flex-shrink-0 h-5 w-5",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                                    !isCollapsed && "mr-3"
                                )}
                                aria-hidden="true"
                            />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-2 border-t border-gray-800">
                <button
                    onClick={() => signOut()}
                    title={isCollapsed ? "Sign out" : undefined}
                    className={cn(
                        "group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors",
                        isCollapsed ? "justify-center" : "px-4"
                    )}
                >
                    <LogOut className={cn("flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-white", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span className="truncate">Sign out</span>}
                </button>
            </div>
        </div>
    )
}
