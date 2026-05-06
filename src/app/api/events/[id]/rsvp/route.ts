import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const userId = session.user.id

  const existing = await prisma.eventAttendee.findUnique({
    where: { userId_eventId: { userId, eventId: id } },
  })

  if (existing) {
    await prisma.eventAttendee.delete({ where: { id: existing.id } })
    return NextResponse.json({ attending: false })
  }

  await prisma.eventAttendee.create({ data: { userId, eventId: id } })
  return NextResponse.json({ attending: true })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    attendees: attendees.map((a) => a.user),
    isAttending: session?.user?.id
      ? attendees.some((a) => a.userId === session.user!.id)
      : false,
  })
}
