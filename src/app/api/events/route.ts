import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const limit = parseInt(searchParams.get("limit") ?? "10")

  const session = await auth()
  const classId = (session?.user as { classId?: string })?.classId

  if (!classId) {
    const defaultClass = await prisma.class.findFirst()
    if (!defaultClass) {
      return NextResponse.json({ items: [], nextCursor: null, hasMore: false })
    }
    return getEvents(defaultClass.id, cursor, limit, session?.user?.id)
  }

  return getEvents(classId, cursor, limit, session?.user?.id)
}

async function getEvents(
  classId: string,
  cursor: string | null,
  limit: number,
  userId?: string
) {
  const events = await prisma.event.findMany({
    where: { classId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { eventTime: "desc" },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, attendees: true } },
    },
  })

  const hasMore = events.length > limit
  const sliced = events.slice(0, limit)

  let attendingSet = new Set<string>()
  if (userId && sliced.length > 0) {
    const attendances = await prisma.eventAttendee.findMany({
      where: { userId, eventId: { in: sliced.map((e) => e.id) } },
      select: { eventId: true },
    })
    attendingSet = new Set(attendances.map((a) => a.eventId))
  }

  const items = sliced.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    eventTime: event.eventTime.toISOString(),
    coverImage: event.coverImage,
    createdAt: event.createdAt.toISOString(),
    creator: event.creator,
    commentCount: event._count.comments,
    attendeeCount: event._count.attendees,
    isAttending: attendingSet.has(event.id),
  }))

  return NextResponse.json({
    items,
    nextCursor: hasMore ? events[limit].id : null,
    hasMore,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const classId = (session.user as { classId?: string })?.classId
  if (!classId) {
    return NextResponse.json({ error: "未加入班级" }, { status: 400 })
  }

  const { title, description, location, eventTime, coverImage } =
    await request.json()

  if (!title?.trim() || !eventTime) {
    return NextResponse.json(
      { error: "请填写活动标题和时间" },
      { status: 400 }
    )
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      eventTime: new Date(eventTime),
      coverImage: coverImage || null,
      creatorId: session.user.id,
      classId,
    },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    eventTime: event.eventTime.toISOString(),
    coverImage: event.coverImage,
    createdAt: event.createdAt.toISOString(),
    creator: event.creator,
    commentCount: 0,
    attendeeCount: 0,
    isAttending: false,
  })
}
