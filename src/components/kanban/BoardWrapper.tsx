"use client"

import dynamic from "next/dynamic"
import { Stage } from "@/types"

const Board = dynamic(() => import("@/components/kanban/Board").then(mod => mod.Board), { ssr: false })

interface BoardWrapperProps {
    initialStages: Stage[]
}

export function BoardWrapper({ initialStages }: BoardWrapperProps) {
    return <Board initialStages={initialStages} />
}
