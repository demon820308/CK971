import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireSuperAdmin() {
  const session = await auth()
  const role = (session?.user as unknown as { role?: string })?.role
  if (role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "无权限" }, { status: 403 }) }
  }
  return { session }
}
