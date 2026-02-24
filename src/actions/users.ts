"use server"

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function changeUserRole(userId: string, newRole: "ADMIN" | "MANAGER" | "OPERATOR") {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (err) {
        return { error: "Failed to update role" }
    }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive }
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (err) {
        return { error: "Failed to update user status" }
    }
}

export async function resetUserPassword(userId: string, newPasswordRaw: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" }

    try {
        const bcrypt = require("bcryptjs")
        const hashedPassword = await bcrypt.hash(newPasswordRaw, 10)
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })
        return { success: true }
    } catch (err) {
        return { error: "Failed to reset password" }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (err) {
        return { error: "Failed to delete user. They might be assigned to leads." }
    }
}

export async function createUser(data: { email: string; name?: string; role: "ADMIN" | "MANAGER" | "OPERATOR"; passwordRaw: string }) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" }

    try {
        const bcrypt = require("bcryptjs")
        const hashedPassword = await bcrypt.hash(data.passwordRaw, 10)

        await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                role: data.role,
                password: hashedPassword,
                isActive: true
            }
        })
        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (err: any) {
        if (err.code === 'P2002') return { error: "Email already exists" }
        return { error: "Failed to create user" }
    }
}
