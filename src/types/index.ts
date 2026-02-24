export type Lead = {
    id: string
    title: string
    status: string
    contactName: string | null
    value: number | null
    createdAt: string
    updatedAt: string
    nextActionDate: string | null
    nextActionType?: string | null
    priority: string
    order: number
    color?: string | null
    borderColor?: string | null
    probability?: number | null
    assigneeId?: string | null
    assignee?: {
        name: string | null
        email: string
    } | null
    events?: LeadEvent[]
}

export type LeadEvent = {
    id: string
    leadId: string
    description: string
    createdAt: string
}

export type Stage = {
    id: string
    name: string
    order: number
    createdAt?: string
    updatedAt?: string
    leads: (Lead & {
        assignee?: {
            name: string | null
            email: string
        } | null
    })[]
}
