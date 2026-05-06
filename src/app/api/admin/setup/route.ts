import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/client"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const existing = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } })
    return NextResponse.json({ exists: !!existing })
  } catch (e) {
    console.error("[admin/setup GET]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const existing = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } })
    if (existing) {
      return NextResponse.json({ error: "超级管理员已存在" }, { status: 403 })
    }

    const { email, name, password } = await request.json()
    if (!email || !name || !password) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "密码至少8位" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: Role.SUPER_ADMIN },
    })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch (e) {
    console.error("[admin/setup POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
