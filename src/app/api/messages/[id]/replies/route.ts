import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const replies = await prisma.messageReply.findMany({
    where: { messageId: id, parentId: null },
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

  return NextResponse.json(replies)
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
    return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 })
  }

  const reply = await prisma.messageReply.create({
    data: {
      content: content.trim(),
      userId: session.user.id,
      messageId: id,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json(reply)
}
