"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"
import { redirect } from "next/navigation"

const prisma = new PrismaClient()

const updateLeadSchema = z.object({
    title: z.string().min(1),
    contactName: z.string().optional(),
    value: z.coerce.number().optional(),
    probability: z.coerce.number().min(0).max(100).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    status: z.enum(["TODO", "WON", "LOST", "CANCELLED"]),
    stageId: z.string().min(1),
    nextActionDate: z.string().optional().nullable(), // ISO string from date picker
    nextActionType: z.enum(["CALL", "EMAIL", "MEETING", "TASK"]).optional().nullable(),
    color: z.string().optional().nullable(),
    borderColor: z.string().optional().nullable(),
})

export async function updateLead(leadId: string, formData: FormData) {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    const rawData = {
        title: formData.get("title"),
        contactName: formData.get("contactName"),
        value: formData.get("value"),
        probability: formData.get("probability"),
        assigneeId: formData.get("assigneeId"),
        status: formData.get("status"),
        stageId: formData.get("stageId"),
        nextActionDate: formData.get("nextActionDate"),
        nextActionType: formData.get("nextActionType"),
        color: formData.get("color"),
        borderColor: formData.get("borderColor"),
    }

    const parse = updateLeadSchema.safeParse(rawData)

    if (!parse.success) {
        console.log(parse.error)
        return { error: "Invalid data" }
    }

    const data = parse.data

    try {
        const oldLead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { stage: true }
        })

        if (!oldLead) return { error: "Lead not found" }

        if (session.user.role === "OPERATOR" && oldLead.assigneeId !== session.user.id) {
            return { error: "Unauthorized: You can only edit your assigned leads" }
        }

        // Only ADMIN/MANAGER can update assignee, otherwise fallback to existing
        const newAssigneeId = session.user.role !== "OPERATOR" && data.assigneeId !== undefined
            ? data.assigneeId
            : oldLead.assigneeId;

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                title: data.title,
                contactName: data.contactName,
                value: data.value,
                probability: data.probability,
                assigneeId: newAssigneeId,
                status: data.status as any,
                stageId: data.stageId,
                nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
                nextActionType: data.nextActionType as any,
                color: data.color || null,
                borderColor: data.borderColor || null,
            },
        })

        // Check for stage/status changes to log events
        const newStage = await prisma.pipelineStage.findUnique({ where: { id: data.stageId } })

        const eventsToCreate = []
        if (oldLead.stageId !== data.stageId && newStage) {
            eventsToCreate.push({
                leadId,
                description: `Moved from stage "${oldLead.stage?.name || 'Unknown'}" to "${newStage.name}"`
            })
        }
        if (oldLead.status !== data.status) {
            eventsToCreate.push({
                leadId,
                description: `Status changed from ${oldLead.status} to ${data.status}`
            })
        }

        if (eventsToCreate.length > 0) {
            await prisma.leadEvent.createMany({ data: eventsToCreate })
        }

        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/leads/${leadId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update lead:", error)
        return { error: "Failed to update lead" }
    }
}

export async function deleteLead(leadId: string) {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    try {
        const oldLead = await prisma.lead.findUnique({ where: { id: leadId } })
        if (!oldLead) return { error: "Lead not found" }

        if (session.user.role === "OPERATOR" && oldLead.assigneeId !== session.user.id) {
            return { error: "Unauthorized: You can only delete your assigned leads" }
        }

        await prisma.lead.delete({
            where: { id: leadId }
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete lead" }
    }
}

export async function deleteLeadEvent(eventId: string, leadId: string) {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    try {
        const eventLead = await prisma.lead.findUnique({ where: { id: leadId } })
        if (!eventLead) return { error: "Lead not found" }

        if (session.user.role === "OPERATOR" && eventLead.assigneeId !== session.user.id) {
            return { error: "Unauthorized: You can only delete events for your assigned leads" }
        }

        await prisma.leadEvent.delete({
            where: { id: eventId }
        })
        revalidatePath(`/dashboard/leads/${leadId}`)
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete event" }
    }
}
