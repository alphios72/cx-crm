"use client"

import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Column } from "./Column"
import { LeadCard } from "./LeadCard"
import { createPortal } from "react-dom"
import { arrayMove } from "@dnd-kit/sortable"
import { updateLeadOrders } from "@/actions/pipeline"
import { Lead, Stage } from "@/types"

interface BoardProps {
    initialStages: Stage[]
}

export function Board({ initialStages }: BoardProps) {
    const [stages, setStages] = useState(initialStages)
    const [activeLead, setActiveLead] = useState<Lead | null>(null)

    // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURN
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    useEffect(() => {
        setStages(initialStages)
    }, [initialStages])

    function onDragStart(event: DragStartEvent) {
        const { active } = event
        const activeId = active.id as string

        // Find the lead being dragged
        let lead: Lead | undefined
        for (const stage of stages) {
            const found = stage.leads.find((l) => l.id === activeId)
            if (found) {
                lead = found
                break
            }
        }

        if (lead) setActiveLead(lead)
    }

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over) {
            setActiveLead(null)
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const activeStage = stages.find(s => s.leads.some(l => l.id === activeId))
        const overStage = stages.find(s => s.id === overId || s.leads.some(l => l.id === overId))

        if (!activeStage || !overStage) {
            setActiveLead(null)
            return
        }

        const activeLeadData = activeStage.leads.find(l => l.id === activeId)!

        // 1. Moving within the same column
        if (activeStage.id === overStage.id) {
            const oldIndex = activeStage.leads.findIndex(l => l.id === activeId)
            const newIndex = overStage.leads.findIndex(l => l.id === overId)

            if (oldIndex !== newIndex && newIndex !== -1) {
                const newLeads = arrayMove(activeStage.leads, oldIndex, newIndex)
                const newStages = stages.map(s => {
                    if (s.id === activeStage.id) {
                        return { ...s, leads: newLeads }
                    }
                    return s
                })
                setStages(newStages)

                // Save to DB
                await updateLeadOrders(newLeads.map((l, idx) => ({ id: l.id, stageId: activeStage.id, order: idx })))
            }
        }
        // 2. Moving to a different column
        else {
            const activeIndex = activeStage.leads.findIndex(l => l.id === activeId)
            let overIndex = overStage.leads.findIndex(l => l.id === overId)

            if (overIndex === -1) {
                // Dropped directly onto the empty column area
                overIndex = overStage.leads.length
            } else {
                // Determine whether dragging above or below the target
                const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
                const modifier = isBelowOverItem ? 1 : 0;
                overIndex = overIndex >= 0 ? overIndex + modifier : overStage.leads.length + 1;
            }

            const newActiveLeads = [...activeStage.leads]
            newActiveLeads.splice(activeIndex, 1)

            const newOverLeads = [...overStage.leads]
            newOverLeads.splice(overIndex, 0, activeLeadData)

            const newStages = stages.map(s => {
                if (s.id === activeStage.id) return { ...s, leads: newActiveLeads }
                if (s.id === overStage.id) return { ...s, leads: newOverLeads }
                return s
            })
            setStages(newStages)

            // Save to DB
            const updates = [
                ...newActiveLeads.map((l, idx) => ({ id: l.id, stageId: activeStage.id, order: idx })),
                ...newOverLeads.map((l, idx) => ({ id: l.id, stageId: overStage.id, order: idx }))
            ]
            await updateLeadOrders(updates)
        }

        setActiveLead(null)
    }

    console.log("CLIENT RENDER STAGES: ", stages.map(s => s.leads));

    return (
        <DndContext id="kanban-board" sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {stages.map((stage) => (
                    <Column key={stage.id} stage={stage} />
                ))}
            </div>
            {typeof document !== 'undefined' && createPortal(
                <DragOverlay>
                    {activeLead && <LeadCard lead={activeLead} />}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    )
}
