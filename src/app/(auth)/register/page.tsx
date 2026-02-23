"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const name = formData.get("name") as string

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, name }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Registration failed")
            }

            router.push("/login?registered=true")
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError("An error occurred")
            }
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
            <div className="flex flex-col space-y-2 text-center mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-gray-500">
                    Enter your email below to create your account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                    <Input id="name" name="name" type="text" placeholder="John Doe" required disabled={loading} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={loading} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    <Input id="password" name="password" type="password" required disabled={loading} />
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Create account" : "Sign Up"}
                </Button>
            </form>

            <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline hover:text-gray-900">
                    Sign in
                </Link>
            </div>
        </div>
    )
}
