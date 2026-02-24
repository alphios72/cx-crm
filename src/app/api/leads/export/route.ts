import { auth } from "@/auth"
import { PrismaClient, Lead, PipelineStage, User } from "@prisma/client"
const prisma = new PrismaClient()
import { NextResponse } from "next/server"
import Papa from "papaparse"

export async function GET() {
    const session = await auth()

    // Feature available to all authenticated users
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const leads = await prisma.lead.findMany({
            include: {
                stage: true,
                assignee: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        const exportData = leads.map((lead: any) => ({
            "Title": lead.title,
            "Contact Name": lead.contactName || "",
            "Value": lead.value || "",
            "Probability": lead.probability || "",
            "Status": lead.status,
            "Pipeline Stage": lead.stage?.name || "",
            "Assignee Email": lead.assignee?.email || "",
            "Next Action Date": lead.nextActionDate ? new Date(lead.nextActionDate).toISOString() : "",
            "Next Action Type": lead.nextActionType || "",
            "Next Action Note": lead.nextActionNote || "",
            "Created At": new Date(lead.createdAt).toISOString(),
        }))

        const csv = Papa.unparse(exportData)

        // Return as a downloadable file
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
            }
        })
    } catch (error) {
        console.error("Export error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
