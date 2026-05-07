import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const comments = await prisma.eventComment.findMany({
    where: { eventId: id, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  })

  return NextResponse.json(comments)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { content, parentId } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 })
  }

  const comment = await prisma.eventComment.create({
    data: {
      content: content.trim(),
      userId: session.user.id,
      eventId: id,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json(comment)
}
