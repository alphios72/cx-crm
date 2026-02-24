import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"
import { LeadHelper } from "@/components/leads/LeadHelper"
import { auth } from "@/auth"

const prisma = new PrismaClient()

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: PageProps) {
    const { id } = await params // Await params in recent Next.js versions if needed, or just access if type is { id: string }
    const session = await auth()
    const userRole = session?.user?.role || "OPERATOR"

    let users: any[] = []
    if (userRole === "ADMIN" || userRole === "MANAGER") {
        users = await prisma.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        })
    }

    const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
            events: {
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { name: true, email: true } }
                }
            }
        }
    })

    if (!lead) {
        notFound()
    }

    const stages = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, name: true }
    })

    // Serialize dates
    const serializedLead = {
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        nextActionDate: lead.nextActionDate?.toISOString() || null,
        value: lead.value ? Number(lead.value) : null,
        order: lead.order,
        probability: lead.probability || null,
        color: lead.color || null,
        borderColor: lead.borderColor || null,
        assigneeId: lead.assigneeId || null,
        events: lead.events.map((event: any) => ({
            ...event,
            createdAt: event.createdAt.toISOString()
        }))
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Lead</h1>
            <LeadHelper lead={serializedLead} stages={stages} users={users} userRole={userRole} />
        </div>
    )
}
