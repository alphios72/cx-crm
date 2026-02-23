import NextAuth from "next-auth"
import { auth as middleware } from "@/auth"

export default middleware((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
    const isOnAuth = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")

    if (isOnDashboard) {
        if (isLoggedIn) return
        return Response.redirect(new URL("/login", req.nextUrl))
    }

    if (isOnAuth) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/dashboard", req.nextUrl))
        }
        return
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
