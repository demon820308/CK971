import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  try {
    const { error } = await requireSuperAdmin()
    if (error) return error

    const cls = await prisma.class.findFirst({
      select: {
        id: true,
        name: true,
        inviteCode: true,
        schoolName: true,
        gradeYear: true,
        endYear: true,
        description: true,
      },
    })

    if (!cls) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 })
    }
    return NextResponse.json(cls)
  } catch (e) {
    console.error("[admin/settings GET]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const body = await request.json()
  const { name, inviteCode, schoolName, gradeYear, endYear, description } = body

  const cls = await prisma.class.findFirst({ select: { id: true } })
  if (!cls) {
    return NextResponse.json({ error: "班级不存在" }, { status: 404 })
  }

  try {
    const updated = await prisma.class.update({
      where: { id: cls.id },
      data: {
        ...(name !== undefined && { name }),
        ...(inviteCode !== undefined && { inviteCode: String(inviteCode).trim() }),
        ...(schoolName !== undefined && { schoolName }),
        ...(gradeYear !== undefined && { gradeYear: gradeYear ? parseInt(gradeYear, 10) : null }),
        ...(endYear !== undefined && { endYear: endYear ? parseInt(endYear, 10) : null }),
        ...(description !== undefined && { description }),
      },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        schoolName: true,
        gradeYear: true,
        endYear: true,
        description: true,
      },
    })

    return NextResponse.json(updated)
  } catch (updateError) {
    if (
      typeof updateError === "object" &&
      updateError !== null &&
      "code" in updateError &&
      updateError.code === "P2002"
    ) {
      return NextResponse.json({ error: "邀请码已被占用" }, { status: 400 })
    }

    console.error("[admin/settings PATCH]", updateError)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}
