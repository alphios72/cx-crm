"use server"

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const prisma = new PrismaClient()

// PERSON ACTIONS (Admin Only)

const PersonSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().optional(),
})

export async function createDeliveryPerson(formData: FormData) {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
        return { error: "Unauthorized" }
    }

    try {
        const data = PersonSchema.parse({
            name: formData.get("name"),
            role: formData.get("role") || undefined,
        })

        await prisma.deliveryPerson.create({ data })
        revalidatePath("/dashboard/delivery")
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Failed to create person" }
    }
}

export async function deleteDeliveryPerson(id: string) {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.deliveryPerson.delete({ where: { id } })
        revalidatePath("/dashboard/delivery")
        return { success: true }
    } catch (e: any) {
        return { error: "Failed to delete person" }
    }
}

// TASK ACTIONS

const TaskSchema = z.object({
    personId: z.string().min(1, "Person ID is required"),
    title: z.string().min(1, "Title is required"),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    assigneeId: z.string().optional(),
    color: z.string().optional(),
    borderColor: z.string().optional(),
})

export async function createDeliveryTask(formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    try {
        const data = TaskSchema.parse({
            personId: formData.get("personId"),
            title: formData.get("title"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            assigneeId: formData.get("assigneeId") || undefined,
            color: formData.get("color") || undefined,
            borderColor: formData.get("borderColor") || undefined,
        })

        const start = new Date(data.startDate)
        const end = new Date(data.endDate)

        if (end < start) {
            return { error: "End date must be after start date" }
        }

        await prisma.deliveryTask.create({
            data: {
                personId: data.personId,
                title: data.title,
                startDate: start,
                endDate: end,
                assigneeId: data.assigneeId || null,
                color: data.color || null,
                borderColor: data.borderColor || null
            }
        })
        revalidatePath("/dashboard/delivery")
        // Also revalidate schedule since we are linking end dates there!
        revalidatePath("/dashboard/schedule")
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Failed to create task" }
    }
}

export async function updateDeliveryTask(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    try {
        const data = TaskSchema.parse({
            personId: formData.get("personId"),
            title: formData.get("title"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            assigneeId: formData.get("assigneeId") || undefined,
            color: formData.get("color") || undefined,
            borderColor: formData.get("borderColor") || undefined,
        })

        const start = new Date(data.startDate)
        const end = new Date(data.endDate)

        await prisma.deliveryTask.update({
            where: { id },
            data: {
                personId: data.personId,
                title: data.title,
                startDate: start,
                endDate: end,
                assigneeId: data.assigneeId || null,
                color: data.color || null,
                borderColor: data.borderColor || null
            }
        })
        revalidatePath("/dashboard/delivery")
        revalidatePath("/dashboard/schedule")
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Failed to update task" }
    }
}

export async function deleteDeliveryTask(id: string) {
    const session = await auth()
    if (!session?.user) {
        return { error: "Unauthorized" }
    }

    try {
        await prisma.deliveryTask.delete({ where: { id } })
        revalidatePath("/dashboard/delivery")
        revalidatePath("/dashboard/schedule")
        return { success: true }
    } catch (e: any) {
        return { error: "Failed to delete task" }
    }
}

