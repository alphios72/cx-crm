"use server"

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import Papa from "papaparse"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function importLeads(formData: FormData) {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
        return { error: "Unauthorized. Admin only." }
    }

    const file = formData.get("file") as File
    if (!file) {
        return { error: "No file provided" }
    }

    try {
        const text = await file.text()
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        })

        if (parsed.errors.length > 0) {
            console.error("CSV Parse Errors:", parsed.errors)
            return { error: "Failed to parse CSV file." }
        }

        const rows: any[] = parsed.data
        if (rows.length === 0) {
            return { error: "CSV is empty." }
        }

        // Pre-fetch related entities to map names/emails to IDs
        const stages = await prisma.pipelineStage.findMany()
        const users = await prisma.user.findMany()

        if (stages.length === 0) {
            return { error: "Please create at least one Pipeline Stage before importing." }
        }
        const defaultStageId = stages[0].id

        let importedCount = 0

        // Use a transaction or sequential creates to capture LeadEvents
        for (const row of rows) {
            const title = row["Title"] || row["title"]
            if (!title) continue // Skip rows without a title

            // Map Pipeline Stage
            const stageName = row["Pipeline Stage"] || row["stage"]
            const matchedStage = stages.find(s => s.name.toLowerCase() === (stageName || "").toLowerCase())
            const stageId = matchedStage ? matchedStage.id : defaultStageId

            // Map Assignee Email
            const assigneeEmail = row["Assignee Email"] || row["assignee"]
            const matchedUser = users.find(u => u.email.toLowerCase() === (assigneeEmail || "").toLowerCase())
            const assigneeId = matchedUser ? matchedUser.id : null

            // Clean numerical fields
            const value = row["Value"] || row["value"] ? parseFloat(row["Value"] || row["value"]) : null
            const propStr = row["Probability"] || row["probability"]
            const probability = propStr ? parseFloat(propStr) : null

            // Next Actions
            const rawNextActionDate = row["Next Action Date"] || row["nextActionDate"]
            const nextActionDate = rawNextActionDate ? new Date(rawNextActionDate) : null

            let nextActionType = row["Next Action Type"] || row["nextActionType"] || null
            if (nextActionType && !["CALL", "EMAIL", "MEETING", "TASK"].includes(nextActionType.toUpperCase())) {
                nextActionType = null
            }
            const nextActionNote = row["Next Action Note"] || row["nextActionNote"] || null

            // Status bounds check
            let status = (row["Status"] || row["status"] || "TODO").toUpperCase()
            if (!["TODO", "WON", "LOST", "CANCELLED"].includes(status)) {
                status = "TODO"
            }

            await prisma.lead.create({
                data: {
                    title,
                    contactName: row["Contact Name"] || row["contactName"] || null,
                    value: isNaN(value as number) ? null : value,
                    probability: isNaN(probability as number) ? null : probability,
                    status: status as any,
                    stageId,
                    creatorId: session.user.id,
                    assigneeId,
                    nextActionDate: isNaN(nextActionDate?.getTime() as number) ? null : nextActionDate,
                    nextActionType: nextActionType as any,
                    nextActionNote,
                    events: {
                        create: {
                            description: "Lead imported via CSV",
                            authorId: session.user.id,
                        }
                    }
                }
            })
            importedCount++
        }

        revalidatePath("/dashboard")
        return { success: true, count: importedCount }
    } catch (error: any) {
        console.error("Import error:", error)
        return { error: `Failed to import leads due to a server error. Meta: ${error.meta ? JSON.stringify(error.meta) : error.message}` }
    }
}
