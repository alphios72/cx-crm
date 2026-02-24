"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { importLeads } from "@/actions/import"
import { useRouter } from "next/navigation"

export function ImportLeadsModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        const result = await importLeads(formData)

        setLoading(false)
        if (result.success) {
            setIsOpen(false)
            alert(`Successfully imported ${result.count} leads!`)
            router.refresh()
        } else {
            alert(result.error || "Failed to import leads")
        }
    }

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
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

                        <h2 className="text-xl font-semibold mb-4">Import Leads (CSV)</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Upload a CSV file to bulk import leads. Make sure the headers match the export format (Title, Contact Name, Value, Probability, Status, Pipeline Stage, Assignee Email, Next Action Date, Next Action Type, Next Action Note).
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="file" className="text-sm font-medium">CSV File</label>
                                <Input id="file" name="file" type="file" accept=".csv" required />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="mr-2">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Importing..." : "Upload & Import"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
