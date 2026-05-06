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

  const existingLike = await prisma.photoLike.findUnique({
    where: {
      userId_photoId: {
        userId,
        photoId: id,
      },
    },
  })

  if (existingLike) {
    await prisma.photoLike.delete({ where: { id: existingLike.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.photoLike.create({
    data: {
      userId,
      photoId: id,
    },
  })

  return NextResponse.json({ liked: true })
}
