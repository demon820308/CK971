import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    console.error("Failed to load event comments", error)
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 })
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
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
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
  } catch (error) {
    console.error("Failed to create event comment", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
