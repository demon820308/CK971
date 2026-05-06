import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const [photoComments, messageReplies, eventComments] = await Promise.all([
    prisma.photoComment.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        photo: { select: { id: true, caption: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.messageReply.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        message: { select: { id: true, content: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventComment.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({ photoComments, messageReplies, eventComments })
}
