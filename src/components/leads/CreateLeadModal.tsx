"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { createLead } from "@/actions/lead"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface CreateLeadModalProps {
    users?: { id: string, name: string | null, email: string }[]
    userRole?: string
}

export function CreateLeadModal({ users = [], userRole = "OPERATOR" }: CreateLeadModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        const result = await createLead(formData)

        setLoading(false)
        if (result.success) {
            setIsOpen(false)
            router.refresh()
        } else {
            alert(result.error) // Simple error handling for MVP
        }
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Lead
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
                    <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg relative animate-in zoom-in-95">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 className="text-xl font-semibold mb-4">Create New Lead</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">Lead Title</label>
                                <Input id="title" name="title" placeholder="Company ABC - Upgrade" required />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
                                <Input id="contactName" name="contactName" placeholder="John Smith" />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="value" className="text-sm font-medium">Value (€)</label>
                                <Input id="value" name="value" type="number" step="0.01" placeholder="1000.00" />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="probability" className="text-sm font-medium">Probability (%)</label>
                                <Input id="probability" name="probability" type="number" min="0" max="100" placeholder="45" />
                            </div>

                            {(userRole === "ADMIN" || userRole === "MANAGER") && users.length > 0 && (
                                <div className="space-y-2">
                                    <label htmlFor="assigneeId" className="text-sm font-medium">Assign To</label>
                                    <select
                                        id="assigneeId"
                                        name="assigneeId"
                                        className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                    >
                                        <option value="">-- Assign to self --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="mr-2">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create Lead"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
