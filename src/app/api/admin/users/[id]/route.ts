import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"
import bcrypt from "bcryptjs"
import { Role } from "@/generated/prisma/client"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    if (user.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "不能删除超级管理员" }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.eventAttendee.deleteMany({ where: { userId: id } }),
      prisma.messageLike.deleteMany({ where: { userId: id } }),
      prisma.photoLike.deleteMany({ where: { userId: id } }),
      prisma.classMember.deleteMany({ where: { userId: id } }),
      prisma.eventComment.deleteMany({ where: { userId: id } }),
      prisma.messageReply.deleteMany({ where: { userId: id } }),
      prisma.photoComment.deleteMany({ where: { userId: id } }),
      prisma.event.deleteMany({ where: { creatorId: id } }),
      prisma.message.deleteMany({ where: { authorId: id } }),
      prisma.photo.deleteMany({ where: { uploaderId: id } }),
      prisma.user.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (deleteError) {
    console.error("Failed to delete user", deleteError)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  if (typeof body.banned === "boolean") {
    const user = await prisma.user.update({
      where: { id },
      data: { banned: body.banned },
      select: { id: true, banned: true },
    })
    return NextResponse.json(user)
  }

  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "密码至少8位" }, { status: 400 })
    }
    const hashed = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({ where: { id }, data: { password: hashed } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 })
}
