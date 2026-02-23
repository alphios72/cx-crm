"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { LeadCard } from "./LeadCard"
import { Stage } from "@/types"
import { User } from "lucide-react"

interface ColumnProps {
    stage: Stage
}

function getStageColor(name: string) {
    const n = name.toLowerCase();
    if (n.includes('prospect') || n.includes('incoming')) return 'bg-[#93C5FD]'; // blue-300
    if (n.includes('qualified') || n.includes('contacted')) return 'bg-[#a5f3fc]'; // cyan-200
    if (n.includes('proposal') || n.includes('demo')) return 'bg-[#6ee7b7]'; // emerald-300
    if (n.includes('negotiation') || n.includes('closing') || n.includes('won')) return 'bg-[#86efac]'; // green-300
    return 'bg-gray-300';
}

export function Column({ stage }: ColumnProps) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
    })

    const totalValue = stage.leads.reduce((acc, lead) => acc + (lead.value || 0), 0);
    const lineColor = getStageColor(stage.name);

    return (
        <div ref={setNodeRef} className="flex h-full w-[300px] min-w-[300px] flex-col shrink-0">
            <div className="p-2 flex flex-col gap-2">
                <h3 className="font-bold text-gray-900 text-[17px]">{stage.name}</h3>
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2">
                    <div className="flex items-center gap-1.5">
                        <User className="w-[14px] h-[14px]" />
                        <span>{stage.leads.length} Leads</span>
                    </div>
                    <span>{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalValue)}</span>
                </div>
                <div className={`h-[3px] w-full rounded-full ${lineColor}`}></div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
                <SortableContext items={stage.leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    {stage.leads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}
