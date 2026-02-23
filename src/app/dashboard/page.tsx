import { PrismaClient } from "@prisma/client"
import { CreateLeadModal } from "@/components/leads/CreateLeadModal"
import { BoardWrapper } from "@/components/kanban/BoardWrapper"
import { auth } from "@/auth"

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
        leads: stage.leads.map(lead => ({
            ...lead,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
            nextActionDate: lead.nextActionDate?.toISOString() || null,
            value: lead.value ? Number(lead.value) : null
        }))
    }))

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
                <CreateLeadModal users={users} userRole={userRole} />
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <BoardWrapper initialStages={serializedStages} />
            </div>
        </div>
    )
}
