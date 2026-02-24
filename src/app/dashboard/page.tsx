import { PrismaClient } from "@prisma/client"
import { CreateLeadModal } from "@/components/leads/CreateLeadModal"
import { ImportLeadsModal } from "@/components/leads/ImportLeadsModal"
import { BoardWrapper } from "@/components/kanban/BoardWrapper"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const prisma = new PrismaClient()

export default async function DashboardPage() {
    const session = await auth()
    const userRole = session?.user?.role || "OPERATOR"

    let users: any[] = []
    if (userRole === "ADMIN" || userRole === "MANAGER") {
        users = await prisma.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        })
    }

    const stages = await prisma.pipelineStage.findMany({
        include: {
            leads: {
                include: {
                    assignee: { select: { name: true, email: true } }
                },
                orderBy: { order: 'asc' }
            }
        },
        orderBy: {
            order: 'asc'
        }
    })

    // Transform for client component serialization
    const serializedStages = stages.map(stage => ({
        ...stage,
        createdAt: stage.createdAt.toISOString(),
        updatedAt: stage.updatedAt.toISOString(),
        leads: stage.leads.map((lead: any) => ({
            ...lead,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
            nextActionDate: lead.nextActionDate?.toISOString() || null,
            value: lead.value ? Number(lead.value) : null,
            assignee: lead.assignee ? { name: lead.assignee.name, email: lead.assignee.email } : null
        }))
    }))

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
                <div className="flex items-center gap-2">
                    {userRole === "ADMIN" && <ImportLeadsModal />}
                    <a href="/api/leads/export" download className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-4 py-2">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </a>
                    <CreateLeadModal users={users} userRole={userRole} />
                </div>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <BoardWrapper initialStages={serializedStages} />
            </div>
        </div>
    )
}
