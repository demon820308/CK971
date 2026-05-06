import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      eventTime: true,
      createdAt: true,
      creator: { select: { id: true, name: true } },
      _count: { select: { comments: true, attendees: true } },
    },
    orderBy: { eventTime: "desc" },
  })

  return NextResponse.json(events)
}
