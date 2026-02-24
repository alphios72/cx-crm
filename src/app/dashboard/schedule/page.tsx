import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
import { ScheduleView } from "@/components/schedule/ScheduleView"

export const dynamic = "force-dynamic"

export default async function SchedulePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Fetch active users for the assignee filter
    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    // Fetch leads with upcoming deadlines
    const leads = await prisma.lead.findMany({
        where: {
            nextActionDate: { not: null }
        },
        orderBy: {
            nextActionDate: 'asc'
        },
        include: {
            stage: true,
            assignee: {
                select: { id: true, name: true, email: true }
            }
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-b pb-4 mb-4">Scadenziario</h1>
                <p className="text-sm text-gray-500 mb-6">Visualizza le tue prossime azioni e scadenze ordinate per data.</p>
            </div>

            <ScheduleView
                initialLeads={leads}
                users={users}
                currentUserRole={session.user.role}
                currentUserId={session.user.id}
            />
        </div>
    )
}
