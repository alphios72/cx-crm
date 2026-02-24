"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function updateLeadStage(leadId: string, newStageId: string) {
    try {
        const session = await auth()
        if (!session || !session.user) return { success: false, error: "Unauthorized" }

        const oldLead = await prisma.lead.findUnique({ where: { id: leadId }, include: { stage: true } })

        if (!oldLead) return { success: false, error: "Lead not found" }

        if (session.user.role === "OPERATOR" && oldLead.assigneeId !== session.user.id) {
            return { success: false, error: "Unauthorized: You can only move your assigned leads" }
        }

        await prisma.lead.update({
            where: { id: leadId },
            data: { stageId: newStageId },
        })

        if (oldLead && oldLead.stageId !== newStageId) {
            const newStage = await prisma.pipelineStage.findUnique({ where: { id: newStageId } })
            if (newStage) {
                await prisma.leadEvent.create({
                    data: {
                        leadId,
                        description: `Moved from stage "${oldLead.stage?.name || 'Unknown'}" to "${newStage.name}"`,
                        authorId: session.user.id,
                    }
                })
            }
        }

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to update lead stage:", error)
        return { success: false, error: "Failed to update lead stage" }
    }
}

export async function updateLeadOrders(updates: { id: string; stageId: string; order: number }[]) {
    try {
        const session = await auth()
        if (!session || !session.user) return { success: false, error: "Unauthorized" }

        const leadsToUpdate = await prisma.lead.findMany({
            where: { id: { in: updates.map((u) => u.id) } },
            include: {
                stage: true,
                assignee: { select: { name: true, email: true } }
            }
        })

        if (session.user.role === "OPERATOR") {
            const unauthorizedLead = leadsToUpdate.find(l => l.assigneeId !== session.user.id)
            if (unauthorizedLead) {
                return { success: false, error: "Unauthorized: You can only move your assigned leads" }
            }
        }

        await prisma.$transaction(
            updates.map((update) =>
                prisma.lead.update({
                    where: { id: update.id },
                    data: { stageId: update.stageId, order: update.order },
                })
            )
        )

        const stages = await prisma.pipelineStage.findMany()
        const eventsToCreate = []

        for (const update of updates) {
            const oldLead = leadsToUpdate.find((l) => l.id === update.id)
            if (oldLead && oldLead.stageId !== update.stageId) {
                const newStage = stages.find((s) => s.id === update.stageId)
                if (newStage) {
                    eventsToCreate.push({
                        leadId: update.id,
                        description: `Moved from stage "${oldLead.stage?.name || 'Unknown'}" to "${newStage.name}"`,
                        authorId: session.user.id,
                    })
                }
            }
        }

        if (eventsToCreate.length > 0) {
            await prisma.leadEvent.createMany({ data: eventsToCreate })
        }

        // We do NOT call revalidatePath("/dashboard") here because the UI is already 
        // optimistically updated and doing so could cause jarring jumping or reset while dragging.
        return { success: true }
    } catch (error) {
        console.error("Failed to update lead orders:", error)
        return { success: false, error: "Failed to update lead orders" }
    }
}
