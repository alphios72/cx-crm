import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cx-crm.com' },
        update: {},
        create: {
            email: 'admin@cx-crm.com',
            password: hashedPassword,
            name: 'Admin',
            role: Role.ADMIN,
            isActive: true,
        }
    })

    // get the UUID of the "TODO" stage (the first one)
    const stage = await prisma.pipelineStage.findFirst()
    if (!stage) {
        console.error('No pipeline stage found')
        return
    }

    const lead = await prisma.lead.create({
        data: {
            title: 'Test Verification Lead assigned to Admin',
            contactName: 'Jane Doe',
            value: 9999,
            stageId: stage.id,
            creatorId: admin.id,
            assigneeId: admin.id
        }
    })

    console.log('Test lead created successfully:', lead.title, 'assigned to', admin.name || admin.email)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
