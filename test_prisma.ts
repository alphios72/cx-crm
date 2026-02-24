import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
    const defaultStageId = (await prisma.pipelineStage.findFirst())?.id
    const adminId = (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id
    if (!defaultStageId || !adminId) throw new Error("Missing stage or admin")
    try {
        await prisma.lead.create({
            data: {
                title: "CSV Import Lead Test Error",
                contactName: "Alice Wonderland",
                value: 5000,
                probability: 80,
                status: "TODO",
                stageId: defaultStageId,
                creatorId: adminId,
                assigneeId: null,
                nextActionDate: null,
                nextActionType: null,
                nextActionNote: null,
                events: {
                    create: {
                        description: "Lead imported via CSV",
                        authorId: adminId,
                    }
                }
            }
        })
        console.log("Success")
    } catch (e: any) {
        console.error("Prisma Error:", e)
    }
}
main()
