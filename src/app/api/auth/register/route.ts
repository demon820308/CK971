export const runtime = "nodejs"

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, email, password, inviteCode } = await request.json()

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      )
    }

    // Find class by invite code, auto-create default class if none exists
    let targetClass = await prisma.class.findUnique({
      where: { inviteCode },
    })

    if (!targetClass) {
      // If database is empty, auto-create default class
      const anyClass = await prisma.class.findFirst()
      if (!anyClass) {
        targetClass = await prisma.class.create({
          data: {
            name: "财会971班",
            description: "我们的青春记忆",
            inviteCode: "CK971-1997",
            gradeYear: 1997,
            schoolName: "厦门商业学校",
          },
        })
      } else {
        return NextResponse.json(
          { error: "邀请码无效" },
          { status: 400 }
        )
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已注册" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and class member in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })

      await tx.classMember.create({
        data: {
          userId: newUser.id,
          classId: targetClass.id,
        },
      })

      return newUser
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch {
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
