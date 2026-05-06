import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
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
