import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const userId = session.user.id

  const { inviteCode } = await request.json()
  if (!inviteCode) {
    return NextResponse.json({ error: "请输入邀请码" }, { status: 400 })
  }

  const targetClass = await prisma.class.findUnique({
    where: { inviteCode },
  })

  if (!targetClass) {
    return NextResponse.json({ error: "邀请码无效" }, { status: 400 })
  }

  // Check if already a member
  const existingMember = await prisma.classMember.findUnique({
    where: {
      userId_classId: {
        userId,
        classId: targetClass.id,
      },
    },
  })

  if (existingMember) {
    return NextResponse.json({ error: "已经是班级成员" }, { status: 400 })
  }

  await prisma.classMember.create({
    data: {
      userId,
      classId: targetClass.id,
    },
  })

  return NextResponse.json({ success: true, classId: targetClass.id })
}
