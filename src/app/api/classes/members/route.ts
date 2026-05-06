import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  const classId = (session?.user as { classId?: string })?.classId

  let targetClassId = classId
  if (!targetClassId) {
    const defaultClass = await prisma.class.findFirst()
    if (!defaultClass) {
      return NextResponse.json({ items: [] })
    }
    targetClassId = defaultClass.id
  }

  const memberships = await prisma.classMember.findMany({
    where: { classId: targetClassId },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, bio: true, role: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  const items = memberships.map((m) => ({
    ...m.user,
    joinedAt: m.joinedAt.toISOString(),
  }))

  return NextResponse.json({ items })
}
