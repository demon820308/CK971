import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    console.error("Failed to load message replies", error)
    return NextResponse.json({ error: "Failed to load replies" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 })
    }

    const { content, parentId } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: "Reply content is required" }, { status: 400 })
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
  } catch (error) {
    console.error("Failed to create message reply", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
