"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

const prisma = new PrismaClient()

const createLeadSchema = z.object({
    title: z.string().min(1),
    contactName: z.string().nullable().optional(),
    value: z.number().nullable().optional(),
    probability: z.coerce.number().min(0).max(100).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    status: z.enum(["TODO", "WON", "LOST", "CANCELLED"]).default("TODO"),
    nextActionNote: z.string().optional().nullable(),
})

export async function createLead(formData: FormData) {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" }
    }

    const rawData = {
        title: formData.get("title"),
        contactName: formData.get("contactName") || null,
        value: formData.get("value") ? Number(formData.get("value")) : null,
        probability: formData.get("probability") ? Number(formData.get("probability")) : null,
        assigneeId: formData.get("assigneeId") || session.user.id,
        status: formData.get("status") || "TODO",
        nextActionNote: formData.get("nextActionNote") || null,
    }

    const parse = createLeadSchema.safeParse(rawData)

    if (!parse.success) {
        console.error("Validation error:", parse.error)
        return { error: "Invalid data" }
    }

    const { title, contactName, value, probability, assigneeId, status, nextActionNote } = parse.data

    try {
        // Find the first stage to assign (usually 'Prospect' or order 1)
        const firstStage = await prisma.pipelineStage.findFirst({
            orderBy: { order: 'asc' }
        })

        if (!firstStage) {
            return { error: "No pipeline stages found" }
        }

        await prisma.lead.create({
            data: {
                title,
                contactName,
                value,
                probability,
                status,
                stageId: firstStage.id,
                creatorId: session.user.id,
                assigneeId: assigneeId || session.user.id,
                nextActionNote,
                events: {
                    create: {
                        description: `Lead created`,
                        authorId: session.user.id,
                    }
                }
            },
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to create lead:", error)
        return { error: "Failed to create lead" }
    }
}
