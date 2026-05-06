import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const defaultClass = await prisma.class.findFirst({
    include: {
      _count: { select: { members: true } },
    },
  })

  if (!defaultClass) {
    return NextResponse.json({ error: "班级不存在" }, { status: 404 })
  }

  return NextResponse.json({
    id: defaultClass.id,
    name: defaultClass.name,
    description: defaultClass.description,
    schoolName: defaultClass.schoolName,
    gradeYear: defaultClass.gradeYear,
    endYear: defaultClass.endYear,
    inviteCode: defaultClass.inviteCode,
    memberCount: defaultClass._count.members,
  })
}
