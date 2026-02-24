import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
    const leads = await prisma.lead.findMany({
        where: {
            nextActionDate: { not: null }
        },
        select: {
            id: true,
            title: true,
            assigneeId: true,
            nextActionDate: true
        }
    })
    console.log("SCHEDULE LEADS:")
    console.dir(leads, { depth: null })

    const unassigned = await prisma.lead.findMany({
        where: {
            assigneeId: null
        },
        select: {
            id: true,
            title: true,
            assigneeId: true,
            nextActionDate: true
        }
    })
    console.log("UNASSIGNED LEADS:")
    console.dir(unassigned, { depth: null })
}
main()
