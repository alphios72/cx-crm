import { Topbar } from "@/components/Topbar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    if (!session) {
        // Middleware should handle this, but double check
        redirect("/login")
    }

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
            <Topbar userRole={session.user.role} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                {children}
            </main>
        </div>
    )
}
