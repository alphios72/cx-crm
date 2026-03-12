import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
import { DeliveryGantt } from "@/components/delivery/DeliveryGantt"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default async function DeliveryPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const people = await prisma.deliveryPerson.findMany({
        orderBy: { name: 'asc' },
        include: {
            tasks: {
                orderBy: { startDate: 'asc' }
            }
        }
    })

    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-b pb-4 mb-4">Delivery</h1>
                <p className="text-sm text-gray-500 mb-6">Gestione delle disponibilità e attività delle risorse.</p>
            </div>

            <Suspense fallback={<div>Caricamento...</div>}>
                <DeliveryGantt
                    initialPeople={people}
                    users={users}
                    userRole={session.user.role}
                />
            </Suspense>
        </div>
    )
}
