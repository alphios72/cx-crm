"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateLead, deleteLead, deleteLeadEvent } from "@/actions/lead-details"
import { useRouter } from "next/navigation"
import { Lead, LeadEvent } from "@/types"
import { Trash2 } from "lucide-react"

interface LeadHelperProps {
    lead: Lead & { stageId: string, assigneeId?: string | null }
    stages: { id: string, name: string }[]
    users?: { id: string, name: string | null, email: string }[]
    userRole?: string
}

export function LeadHelper({ lead, stages, users = [], userRole = "OPERATOR" }: LeadHelperProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const defaultDate = lead.nextActionDate
        ? new Date(lead.nextActionDate).toISOString().slice(0, 16)
        : ""

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        // Add status if not in form (or handled by select)
        // We'll add status select to form

        const result = await updateLead(lead.id, formData)
        setLoading(false)

        if (result.success) {
            router.push("/dashboard")
            router.refresh()
        } else {
            alert("Failed to update lead")
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this lead?")) return
        setLoading(true)
        const result = await deleteLead(lead.id)
        if (result && result.success) {
            router.push("/dashboard")
        } else {
            alert("Failed to delete")
            setLoading(false)
        }
    }

    async function handleDeleteEvent(eventId: string) {
        if (!confirm("Are you sure you want to delete this event?")) return
        setLoading(true)
        const result = await deleteLeadEvent(eventId, lead.id)
        if (result && result.success) {
            router.refresh()
        } else {
            alert("Failed to delete event")
        }
        setLoading(false)
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-black">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Lead Details</h2>
                <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    Delete Lead
                </Button>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="details">Editing</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">Lead Title</label>
                                <Input id="title" name="title" defaultValue={lead.title} required />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
                                <Input id="contactName" name="contactName" defaultValue={lead.contactName || ""} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="value" className="text-sm font-medium">Value (€)</label>
                                <Input id="value" name="value" type="number" step="0.01" defaultValue={lead.value || ""} />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="probability" className="text-sm font-medium">Probability (%)</label>
                                <Input id="probability" name="probability" type="number" min="0" max="100" defaultValue={lead.probability || ""} />
                            </div>

                            {(userRole === "ADMIN" || userRole === "MANAGER") && users.length > 0 ? (
                                <div className="space-y-2">
                                    <label htmlFor="assigneeId" className="text-sm font-medium">Assignee</label>
                                    <select
                                        id="assigneeId"
                                        name="assigneeId"
                                        defaultValue={lead.assigneeId || ""}
                                        className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <label htmlFor="stageId" className="text-sm font-medium">Pipeline Stage</label>
                                <select
                                    id="stageId"
                                    name="stageId"
                                    defaultValue={lead.stageId}
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                >
                                    {stages.map(stage => (
                                        <option key={stage.id} value={stage.id}>{stage.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="status" className="text-sm font-medium">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue={lead.status}
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="WON">Won</option>
                                    <option value="LOST">Lost</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="color" className="text-sm font-medium">Card Background Color</label>
                                <div className="flex gap-2 items-center">
                                    <Input id="color" name="color" type="color" defaultValue={lead.color || "#ffffff"} className="w-16 h-10 p-1 cursor-pointer" />
                                    <span className="text-xs text-gray-500">(Optional custom color)</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="borderColor" className="text-sm font-medium">Card Border Color</label>
                                <div className="flex gap-2 items-center">
                                    <Input id="borderColor" name="borderColor" type="color" defaultValue={lead.borderColor || "#f9fafb"} className="w-16 h-10 p-1 cursor-pointer" />
                                    <span className="text-xs text-gray-500">(Optional custom border)</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-semibold mb-4">Next Action</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="nextActionDate" className="text-sm font-medium">Date & Time</label>
                                    <Input
                                        id="nextActionDate"
                                        name="nextActionDate"
                                        type="datetime-local"
                                        defaultValue={defaultDate}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="nextActionType" className="text-sm font-medium">Action Type</label>
                                    <select
                                        id="nextActionType"
                                        name="nextActionType"
                                        defaultValue={lead.nextActionType || "CALL"}
                                        className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                    >
                                        <option value="CALL">Call</option>
                                        <option value="EMAIL">Email</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="TASK">Task</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="nextActionNote" className="text-sm font-medium">Action Note</label>
                                    <textarea
                                        id="nextActionNote"
                                        name="nextActionNote"
                                        defaultValue={(lead as any).nextActionNote || ""}
                                        placeholder="Add a note for the next action..."
                                        className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="button" variant="ghost" onClick={() => router.back()} className="mr-2">
                                Back
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="history">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Event History</h3>
                        {!lead.events || lead.events.length === 0 ? (
                            <p className="text-gray-500 text-sm">No history events recorded yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {lead.events.map((event: any) => (
                                    <div key={event.id} className="flex justify-between items-start p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 mb-1">{event.description}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span>{new Date(event.createdAt).toLocaleString()}</span>
                                                {event.author && (
                                                    <>
                                                        <span>•</span>
                                                        <span>by {event.author.name || event.author.email}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1"
                                            onClick={() => handleDeleteEvent(event.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
