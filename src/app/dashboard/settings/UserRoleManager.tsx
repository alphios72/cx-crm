"use client"

import { useState } from "react"
import { changeUserRole } from "@/actions/users"

interface User {
    id: string
    name: string | null
    email: string
    role: string
    isActive: boolean
    createdAt: Date
}

export function UserRoleManager({ users, currentUserId }: { users: User[], currentUserId: string }) {
    const [loading, setLoading] = useState<string | null>(null)

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

        setLoading(userId)
        const res = await changeUserRole(userId, newRole as any)

        if (res?.error) {
            alert(res.error)
        }
        setLoading(null)
    }

    const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'reactivate'} this user?`)) return
        setLoading(userId)
        const res = await import("@/actions/users").then(m => m.updateUserStatus(userId, !currentStatus))
        if (res?.error) alert(res.error)
        setLoading(null)
    }

    const handlePasswordReset = async (userId: string) => {
        const newPassword = prompt("Enter the new password for this user (min 6 characters):")
        if (!newPassword || newPassword.length < 6) {
            if (newPassword !== null) alert("Password must be at least 6 characters.")
            return
        }
        setLoading(userId)
        const res = await import("@/actions/users").then(m => m.resetUserPassword(userId, newPassword))
        if (res?.error) alert(res.error)
        else alert("Password reset successful.")
        setLoading(null)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you VERY SURE you want to delete this user? This cannot be undone and may fail if they own leads.")) return
        setLoading(userId)
        const res = await import("@/actions/users").then(m => m.deleteUser(userId))
        if (res?.error) alert(res.error)
        setLoading(null)
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="py-3 px-4 font-semibold text-sm">Name</th>
                        <th className="py-3 px-4 font-semibold text-sm">Email</th>
                        <th className="py-3 px-4 font-semibold text-sm text-gray-500">Joined</th>
                        <th className="py-3 px-4 font-semibold text-sm text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-sm text-center">Role</th>
                        <th className="py-3 px-4 font-semibold text-sm text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium">{user.name || "-"}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{new Date(user.createdAt).toISOString().split('T')[0]}</td>
                            <td className="py-3 px-4 text-sm text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.isActive ? 'Active' : 'Suspended'}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                                <select
                                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[100px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:opacity-50"
                                    value={user.role}
                                    disabled={user.id === currentUserId || loading === user.id}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="OPERATOR">Operator</option>
                                </select>
                            </td>
                            <td className="py-3 px-4 text-sm text-right space-x-2">
                                <button
                                    onClick={() => handleStatusToggle(user.id, user.isActive)}
                                    disabled={user.id === currentUserId || loading === user.id}
                                    className={`text-xs px-2 py-1 rounded border disabled:opacity-50 ${user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                                >
                                    {user.isActive ? 'Suspend' : 'Reactivate'}
                                </button>
                                <button
                                    onClick={() => handlePasswordReset(user.id)}
                                    disabled={loading === user.id}
                                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Reset Pass
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    disabled={user.id === currentUserId || loading === user.id}
                                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    title="Delete User"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
