import { PrismaClient } from "@prisma/client"
import fs from "fs"
import Papa from "papaparse"

const prisma = new PrismaClient()

async function main() {
    const adminId = (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id
    if (!adminId) throw new Error("No admin")

    const text = fs.readFileSync("test_import.csv", "utf8")
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
    const rows: any[] = parsed.data

    const stages = await prisma.pipelineStage.findMany()
    const users = await prisma.user.findMany()
    const defaultStageId = stages[0].id

    for (const row of rows) {
        try {
            const title = row["Title"] || row["title"]
            if (!title) continue

            const stageName = row["Pipeline Stage"] || row["stage"]
            const matchedStage = stages.find(s => s.name.toLowerCase() === (stageName || "").toLowerCase())
            const stageId = matchedStage ? matchedStage.id : defaultStageId

            const assigneeEmail = row["Assignee Email"] || row["assignee"]
            const matchedUser = users.find(u => u.email.toLowerCase() === (assigneeEmail || "").toLowerCase())
            const assigneeId = matchedUser ? matchedUser.id : null

            const value = row["Value"] || row["value"] ? parseFloat(row["Value"] || row["value"]) : null
            const propStr = row["Probability"] || row["probability"]
            const probability = propStr ? parseFloat(propStr) : null

            const rawNextActionDate = row["Next Action Date"] || row["nextActionDate"]
            const nextActionDate = rawNextActionDate ? new Date(rawNextActionDate) : null

            let nextActionType = row["Next Action Type"] || row["nextActionType"] || null
            if (nextActionType && !["CALL", "EMAIL", "MEETING", "TASK"].includes(nextActionType.toUpperCase())) {
                nextActionType = null
            }
            const nextActionNote = row["Next Action Note"] || row["nextActionNote"] || null

            let status = (row["Status"] || row["status"] || "TODO").toUpperCase()
            if (!["TODO", "WON", "LOST", "CANCELLED"].includes(status)) {
                status = "TODO"
            }

            console.log("Attempting to insert:", title, { stageId, assigneeId, creatorId: adminId, nextActionDate, nextActionType, nextActionNote, status })

            await prisma.lead.create({
                data: {
                    title,
                    contactName: row["Contact Name"] || row["contactName"] || null,
                    value: isNaN(value as number) ? null : value,
                    probability: isNaN(probability as number) ? null : probability,
                    status: status as any,
                    stageId,
                    creatorId: adminId,
                    assigneeId,
                    nextActionDate: isNaN(nextActionDate?.getTime() as number) ? null : nextActionDate,
                    nextActionType: nextActionType as any,
                    nextActionNote,
                    events: {
                        create: {
                            description: "Lead imported via CSV",
                            authorId: adminId,
                        }
                    }
                }
            })
            console.log("Successfully inserted:", title)
        } catch (e: any) {
            console.error("Failed on:", row["Title"])
            console.error(e.message)
        }
    }
}
main()
