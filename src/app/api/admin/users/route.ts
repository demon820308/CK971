import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/client"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const users = await prisma.user.findMany({
    where: { role: { not: Role.SUPER_ADMIN } },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      banned: true,
      createdAt: true,
      _count: { select: { photos: true, messages: true, events: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}
