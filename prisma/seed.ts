
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const stages = [
    { name: 'Prospect', order: 1 },
    { name: 'Qualified', order: 2 },
    { name: 'Proposal Sent', order: 3 },
    { name: 'Negotiation', order: 4 },
    { name: 'Closed Won', order: 5 },
  ]

  for (const stage of stages) {
    // Check if stage exists by name to avoid duplicates on re-seed
    const existing = await prisma.pipelineStage.findFirst({
      where: { name: stage.name }
    })
    
    if (!existing) {
      await prisma.pipelineStage.create({
        data: stage
      })
      console.log(`Created stage: ${stage.name}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
