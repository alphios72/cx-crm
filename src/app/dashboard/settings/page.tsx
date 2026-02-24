import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserRoleManager } from "./UserRoleManager"
import { CreateUserModal } from "./CreateUserModal"

const prisma = new PrismaClient()

export default async function SettingsPage() {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">User Management</h1>
                    <p className="text-gray-600 text-sm">Manage roles and permissions for all users in the system. Only Administrators can access this page.</p>
                </div>
                <CreateUserModal />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <UserRoleManager users={users} currentUserId={session.user.id} />
            </div>
        </div>
    )
}
