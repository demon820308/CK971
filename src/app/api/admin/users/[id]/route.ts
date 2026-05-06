import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"
import bcrypt from "bcryptjs"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
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
