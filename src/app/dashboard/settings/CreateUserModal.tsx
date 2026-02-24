"use client"

import { useState } from "react"
import { createUser } from "@/actions/users"
import { Plus } from "lucide-react"

export function CreateUserModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function action(formData: FormData) {
        setLoading(true)
        setError("")

        const email = formData.get("email") as string
        const name = formData.get("name") as string
        const role = formData.get("role") as "ADMIN" | "MANAGER" | "OPERATOR"
        const passwordRaw = formData.get("password") as string

        if (passwordRaw.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        const res = await createUser({ email, name, role, passwordRaw })

        if (res?.error) {
            setError(res.error)
        } else {
            setIsOpen(false)
        }
        setLoading(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-9 px-4 py-2"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add User
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-semibold mb-4">Create New User</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <form action={action} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="john@example.com"
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
                                <select
                                    name="role"
                                    required
                                    defaultValue="OPERATOR"
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                >
                                    <option value="OPERATOR">Operator</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Initial Password <span className="text-red-500">*</span></label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                                />
                                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
                            </div>

                            <div className="pt-4 flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
                                >
                                    {loading ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
