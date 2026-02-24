import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
    // Create an unassigned lead with a next action date to prove it works
    const stages = await prisma.pipelineStage.findMany()
    await prisma.lead.create({
        data: {
            title: "Test Unassigned Scadenza",
            status: "TODO",
            stageId: stages[0].id,
            creatorId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
            assigneeId: null,
            nextActionDate: new Date(),
            nextActionType: "TASK",
            nextActionNote: "Test note"
        }
    })
    console.log("Created test unassigned lead with nextActionDate")
}
main()
