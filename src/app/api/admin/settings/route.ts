import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  try {
    const { error } = await requireSuperAdmin()
    if (error) return error

    const cls = await prisma.class.findFirst({
      select: { id: true, name: true, schoolName: true, gradeYear: true, endYear: true, description: true },
    })

    if (!cls) return NextResponse.json({ error: "班级不存在" }, { status: 404 })
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
  const { name, schoolName, gradeYear, endYear, description } = body

  const cls = await prisma.class.findFirst({ select: { id: true } })
  if (!cls) return NextResponse.json({ error: "班级不存在" }, { status: 404 })

  const updated = await prisma.class.update({
    where: { id: cls.id },
    data: {
      ...(name !== undefined && { name }),
      ...(schoolName !== undefined && { schoolName }),
      ...(gradeYear !== undefined && { gradeYear: gradeYear ? parseInt(gradeYear) : null }),
      ...(endYear !== undefined && { endYear: endYear ? parseInt(endYear) : null }),
      ...(description !== undefined && { description }),
    },
    select: { id: true, name: true, schoolName: true, gradeYear: true, endYear: true, description: true },
  })

  return NextResponse.json(updated)
}
