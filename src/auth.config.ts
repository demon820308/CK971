import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname
      const role = (auth?.user as unknown as { role?: string })?.role

      if (pathname.startsWith("/admin")) {
        if (pathname === "/admin/setup") return true
        if (role !== "SUPER_ADMIN") {
          return Response.redirect(new URL("/", nextUrl))
        }
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as { role: string }).role
        token.classId = (user as unknown as { classId: string | null }).classId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as unknown as { id: string }).id = token.id as string
        ;(session.user as unknown as { role: string }).role = token.role as string
        ;(session.user as unknown as { classId: string | null }).classId =
          token.classId as string | null
      }
      return session
    },
  },
}
