import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const messages = await prisma.message.findMany({
    select: {
      id: true,
      content: true,
      color: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
      _count: { select: { likes: true, replies: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(messages)
}
