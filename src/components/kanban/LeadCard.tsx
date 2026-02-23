"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Lead } from "@/types"
import Link from "next/link"
import { Star, PhoneCall, Mail, Calendar, CheckSquare } from "lucide-react"

interface LeadCardProps {
    lead: Lead
}

// Generate a random-ish consistent color for Avatar based on title
function getAvatarColor(title: string) {
    const colors = [
        'bg-[#bfdbfe] text-[#1d4ed8]', // blue
        'bg-[#a7f3d0] text-[#047857]', // green
        'bg-[#fed7aa] text-[#c2410c]', // orange
        'bg-[#e9d5ff] text-[#7e22ce]', // purple
        'bg-[#fbcfe8] text-[#be185d]', // pink
        'bg-[#a5f3fc] text-[#0e7490]'  // cyan
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash += title.charCodeAt(i);
    return colors[hash % colors.length];
}

function getActionIcon(type?: string | null) {
    switch (type) {
        case 'EMAIL': return <Mail className="w-[11px] h-[11px]" />;
        case 'MEETING': return <Calendar className="w-[11px] h-[11px]" />;
        case 'TASK': return <CheckSquare className="w-[11px] h-[11px]" />;
        case 'CALL':
        default: return <PhoneCall className="w-[11px] h-[11px]" />;
    }
}

function getActionColor(type?: string | null) {
    switch (type) {
        case 'EMAIL': return "bg-[#60a5fa]"; // blue
        case 'MEETING': return "bg-[#c084fc]"; // purple
        case 'TASK': return "bg-[#f59e0b]"; // amber
        case 'CALL':
        default: return "bg-[#2dd4bf]"; // teal
    }
}

export function LeadCard({ lead }: LeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const firstLetter = lead.title ? lead.title.charAt(0).toUpperCase() : '?';
    const avatarColor = getAvatarColor(lead.title);
    const isHighPriority = lead.priority === 'HIGH';

    // Red if HIGH priority, otherwise color based on action type
    const actionColor = isHighPriority ? "bg-[#f87171]" : getActionColor(lead.nextActionType);

    // Remove attributes causing hydration mismatches
    const safeAttributes = { ...attributes } as any
    delete safeAttributes['aria-roledescription']
    delete safeAttributes['aria-describedby']

    let timeLabel = ""
    if (lead.nextActionDate) {
        const diff = new Date(lead.nextActionDate).getTime() - new Date().getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        if (days === 0) timeLabel = "Today"
        else if (days < 0) timeLabel = "Overdue"
        else timeLabel = `${days}d`
    }

    return (
        <div ref={setNodeRef} style={style} {...safeAttributes} {...listeners}>
            <div
                className={cn(
                    "cursor-grab active:cursor-grabbing rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-4 transition-all hover:shadow-md group",
                    isDragging ? "opacity-50 ring-2 ring-blue-400" : "opacity-100",
                    !lead.color && "bg-white",
                    !lead.borderColor && "border border-gray-50/50"
                )}
                style={{
                    backgroundColor: lead.color || undefined,
                    border: lead.borderColor ? `1px solid ${lead.borderColor}` : undefined
                }}
            >
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] ${avatarColor}`}>
                            {firstLetter}
                        </div>
                        <Link href={`/dashboard/leads/${lead.id}`} className="font-bold text-[#111827] text-[15px] hover:underline decoration-blue-500 underline-offset-2">
                            {lead.title}
                        </Link>
                    </div>
                    <Star className={`w-4 h-4 mt-1 ${isHighPriority ? 'fill-[#fbbf24] text-[#fbbf24]' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`} />
                </div>

                <div className="flex justify-between items-end mt-3 gap-2">
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Value</span>
                            <span className="text-gray-700 text-[13px] font-medium">
                                {lead.value ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.value) : "0 €"}
                            </span>
                        </div>
                        {lead.probability != null && (
                            <div className="flex items-baseline gap-1.5 truncate">
                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Probability</span>
                                <span className="text-gray-700 text-[12px] font-medium">
                                    {lead.probability}%
                                </span>
                            </div>
                        )}
                    </div>
                    {timeLabel && (
                        <div className={`flex items-center gap-1.5 text-white text-[11px] font-bold px-2.5 py-1 rounded-[6px] flex-shrink-0 mb-[2px] ${actionColor}`}>
                            {getActionIcon(lead.nextActionType)}
                            <span>{timeLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
