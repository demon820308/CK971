import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const photo = await prisma.photo.findUnique({ where: { id } })
  if (!photo) {
    return NextResponse.json({ error: "照片不存在" }, { status: 404 })
  }

  const userRole = (session.user as { role?: string })?.role
  if (photo.uploaderId !== session.user.id && userRole !== "ADMIN") {
    return NextResponse.json({ error: "无权删除" }, { status: 403 })
  }

  await prisma.photo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
