import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { StickyColor } from "@/generated/prisma/client"

type MessageRecord = {
  id: string
  content: string
  color: StickyColor
  createdAt: Date
  rotation: number
  posX: number | null
  posY: number | null
  author: { id: string; name: string; avatar: string | null }
  _count: { likes: number; replies: number }
  likes: { id: string }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const limit = parseInt(searchParams.get("limit") ?? "30")
  const topLiked = parseInt(searchParams.get("topLiked") ?? "0")

  const session = await auth()
  const classId = (session?.user as { classId?: string })?.classId

  if (!classId) {
    const defaultClass = await prisma.class.findFirst()
    if (!defaultClass) {
      return NextResponse.json({ items: [], nextCursor: null, hasMore: false })
    }
    return getMessages(defaultClass.id, cursor, limit, session?.user?.id, topLiked)
  }

  return getMessages(classId, cursor, limit, session?.user?.id, topLiked)
}

function formatMessage(msg: MessageRecord, userId?: string) {
  return {
    id: msg.id,
    content: msg.content,
    color: msg.color,
    createdAt: msg.createdAt.toISOString(),
    rotation: msg.rotation,
    posX: msg.posX,
    posY: msg.posY,
    author: msg.author,
    likeCount: msg._count.likes,
    replyCount: msg._count.replies,
    isLiked: userId ? msg.likes.length > 0 : false,
  }
}

async function getMessages(
  classId: string,
  cursor: string | null,
  limit: number,
  userId?: string,
  topLiked = 0
) {
  const includeClause = {
    author: { select: { id: true, name: true, avatar: true } },
    likes: userId ? { where: { userId }, select: { id: true } } : false as const,
    _count: { select: { likes: true, replies: true } },
  }

  // First page with featured top-liked section
  if (topLiked > 0 && !cursor) {
    // Fetch all messages lightweight for JS-side sort
    const allSlim = await prisma.message.findMany({
      where: { classId },
      select: { id: true, createdAt: true, _count: { select: { likes: true } } },
    })
    // Sort: likes desc, then date desc as tiebreaker
    allSlim.sort((a, b) =>
      b._count.likes !== a._count.likes
        ? b._count.likes - a._count.likes
        : b.createdAt.getTime() - a.createdAt.getTime()
    )
    const featuredIds = allSlim.slice(0, topLiked).map((m) => m.id)
    const restIds = allSlim.slice(topLiked, limit).map((m) => m.id)
    const hasMore = allSlim.length > limit

    const [featuredRaw, restRaw] = await Promise.all([
      prisma.message.findMany({ where: { id: { in: featuredIds } }, include: includeClause }),
      prisma.message.findMany({ where: { id: { in: restIds } }, include: includeClause }),
    ])
    const fMap = new Map(featuredRaw.map((m) => [m.id, m]))
    const rMap = new Map(restRaw.map((m) => [m.id, m]))
    const featured = featuredIds.map((id) => fMap.get(id)!).filter(Boolean)
    const rest = restIds.map((id) => rMap.get(id)!).filter(Boolean)

    return NextResponse.json({
      items: [...featured, ...rest].map((m) => formatMessage(m, userId)),
      nextCursor: hasMore ? allSlim[limit].id : null,
      hasMore,
    })
  }

  // Normal cursor-based pagination
  const messages = await prisma.message.findMany({
    where: { classId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: includeClause,
  })
  const hasMore = messages.length > limit
  return NextResponse.json({
    items: messages.slice(0, limit).map((m) => formatMessage(m, userId)),
    nextCursor: hasMore ? messages[limit].id : null,
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

  const { content, color } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: "留言内容不能为空" }, { status: 400 })
  }

  // Generate position with collision avoidance
  const existingCount = await prisma.message.count({ where: { classId } })
  const posX = 5 + Math.random() * 80
  const posY = 5 + (existingCount % 5) * 18 + Math.random() * 10

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      color: color || "YELLOW",
      authorId: session.user.id,
      classId,
      rotation: (Math.random() - 0.5) * 10,
      posX,
      posY,
    },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json({
    id: message.id,
    content: message.content,
    color: message.color,
    createdAt: message.createdAt.toISOString(),
    rotation: message.rotation,
    posX: message.posX,
    posY: message.posY,
    author: message.author,
    likeCount: 0,
    replyCount: 0,
    isLiked: false,
  })
}
