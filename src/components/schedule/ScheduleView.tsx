"use client"

import { useState, useEffect } from "react"
import type { Lead, PipelineStage, ActionType } from "@prisma/client"
import { Calendar, Phone, Mail, Users, CheckSquare, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

type AssigneeRecord = { id: string, name: string | null, email: string }

type ScheduleLead = Lead & {
    stage: PipelineStage
    assignee: AssigneeRecord | null
}

interface ScheduleViewProps {
    initialLeads: ScheduleLead[]
    deliveryTasks?: any[] // Support delivery tasks as well
    users: AssigneeRecord[]
    currentUserRole: string
    currentUserId: string
}

function getActionIcon(type: ActionType | null) {
    switch (type) {
        case "CALL": return <Phone className="h-4 w-4 text-orange-500" />
        case "EMAIL": return <Mail className="h-4 w-4 text-blue-500" />
        case "MEETING": return <Users className="h-4 w-4 text-indigo-500" />
        case "TASK": return <CheckSquare className="h-4 w-4 text-green-500" />
        default: return <Calendar className="h-4 w-4 text-gray-400" />
    }
}

function getActionLabel(type: ActionType | null) {
    switch (type) {
        case "CALL": return "Chiamata"
        case "EMAIL": return "Email"
        case "MEETING": return "Riunione"
        case "TASK": return "Task"
        default: return "Azione"
    }
}

export function ScheduleView({ initialLeads, deliveryTasks = [], users, currentUserRole, currentUserId }: ScheduleViewProps) {
    const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL")
    const [isMounted, setIsMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Filter the leads based on selection
    const filteredLeads = initialLeads.filter(lead => {
        if (selectedAssignee === "ALL") return true
        if (selectedAssignee === "UNASSIGNED") return lead.assigneeId === null
        return lead.assigneeId === selectedAssignee
    })

    // Prepare combined array of items for schedule
    const scheduleItems = [
        ...filteredLeads.map(l => ({
            id: l.id,
            type: 'LEAD',
            date: l.nextActionDate,
            title: l.title,
            actionType: l.nextActionType,
            actionNote: l.nextActionNote,
            assignee: l.assignee,
            stage: l.stage.name,
            contactName: l.contactName
        })),
        ...deliveryTasks.map(t => ({
            id: t.id,
            type: 'TASK',
            date: t.endDate,
            title: t.title,
            actionType: 'TASK',
            actionNote: `Fine Attività - ${t.person.name}`,
            assignee: t.assignee || null,
            stage: "Delivery",
            contactName: "-"
        }))
    ].filter(item => item.date !== null).sort((a, b) => new Date(a.date as Date).getTime() - new Date(b.date as Date).getTime())

    return (
        <div className="space-y-4">
            {/* Toolbar / Filters */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <label htmlFor="assignee-filter" className="text-sm font-medium text-gray-700">Filtra per Assegnatario:</label>
                    <select
                        id="assignee-filter"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-w-[200px]"
                    >
                        <option value="ALL">Tutti gli assegnatari</option>
                        <option value="UNASSIGNED">Non assegnati</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.email} {u.id === currentUserId ? "(Tu)" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="text-sm text-gray-500">
                    Trovate <span className="font-semibold text-gray-900">{scheduleItems.length}</span> scadenze
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data e Ora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azione</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fase</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assegnatario</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {scheduleItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Nessuna scadenza trovata per i criteri selezionati.
                                    </td>
                                </tr>
                            ) : (
                                scheduleItems.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {isMounted && item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: it }) : "-"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {isMounted && item.date ? format(new Date(item.date), "HH:mm") : ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                                    {getActionIcon(item.actionType as ActionType)}
                                                </div>
                                                <div className="ml-3">
                                                    <span className="text-sm font-medium text-gray-900">{getActionLabel(item.actionType as ActionType)}</span>
                                                    {item.actionNote && (
                                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] line-clamp-2" title={item.actionNote}>
                                                            {item.actionNote}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                {item.type === 'LEAD' ? (
                                                    <Link href={`/dashboard/leads/${item.id}`}>
                                                        {item.title}
                                                    </Link>
                                                ) : (
                                                    <Link href={`/dashboard/delivery?taskId=${item.id}`}>
                                                        {item.title}
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">{item.contactName || "Nessun Contatto"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                {item.stage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-[10px] uppercase">
                                                        {(item.assignee.name || item.assignee.email || "XX").substring(0, 2)}
                                                    </div>
                                                    <span>{item.assignee.name || item.assignee.email?.split('@')[0]}</span>
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-400">Non assegnato</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
