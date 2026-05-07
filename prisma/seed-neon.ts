import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_yR1MBZv2QGIq@ep-lively-violet-aopruxud.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

const prisma = new PrismaClient()

async function main() {
  let defaultClass = await prisma.class.findFirst()

  if (defaultClass) {
    defaultClass = await prisma.class.update({
      where: { id: defaultClass.id },
      data: {
        name: "财会971班",
        description: "我们的青春记忆",
        inviteCode: "CK971-1997",
        gradeYear: 1997,
        schoolName: "厦门商业学校",
      },
    })
    console.log("Class info updated!")
  } else {
    defaultClass = await prisma.class.create({
      data: {
        name: "财会971班",
        description: "我们的青春记忆",
        inviteCode: "CK971-1997",
        gradeYear: 1997,
        schoolName: "厦门商业学校",
      },
    })

    const adminPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
      data: {
        email: "admin@classmemo.com",
        name: "班长",
        password: adminPassword,
        role: "ADMIN",
        bio: "永远的三班班长",
      },
    })

    const memberData = [
      { name: "小明", email: "xiaoming@classmemo.com", bio: "篮球少年" },
      { name: "小红", email: "xiaohong@classmemo.com", bio: "文艺委员" },
      { name: "小刚", email: "xiaogang@classmemo.com", bio: "数学课代表" },
      { name: "小美", email: "xiaomei@classmemo.com", bio: "美术特长生" },
      { name: "阿杰", email: "ajie@classmemo.com", bio: "吉他手" },
    ]

    const password = await bcrypt.hash("123456", 10)
    const members = []

    for (const data of memberData) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password,
          bio: data.bio,
        },
      })
      members.push(user)
    }

    const allUsers = [admin, ...members]
    for (const user of allUsers) {
      await prisma.classMember.create({
        data: { userId: user.id, classId: defaultClass.id },
      })
    }

    const stickyColors = ["YELLOW", "PINK", "BLUE", "GREEN"] as const
    const messages = [
      "时光不老，我们不散",
      "那些年，我们一起追过的梦",
      "毕业快乐，前程似锦",
      "财会971班永远是最棒的！",
      "青春是一场大雨，即使感冒了，还盼望回头再淋一次",
      "愿你走出半生，归来仍是少年",
    ]

    for (let i = 0; i < messages.length; i++) {
      await prisma.message.create({
        data: {
          content: messages[i],
          color: stickyColors[i % stickyColors.length],
          authorId: allUsers[i % allUsers.length].id,
          classId: defaultClass.id,
          rotation: (Math.random() - 0.5) * 10,
          posX: 10 + Math.random() * 70,
          posY: 10 + Math.random() * 70,
        },
      })
    }

    const events = [
      {
        title: "毕业聚餐",
        description: "最后一次全班聚餐，回忆三年的点点滴滴",
        location: "学校食堂三楼",
        eventTime: new Date("2022-06-15"),
      },
      {
        title: "运动会",
        description: "财会971班勇夺接力赛冠军！",
        location: "学校操场",
        eventTime: new Date("2021-10-20"),
      },
    ]

    for (const event of events) {
      await prisma.event.create({
        data: {
          ...event,
          creatorId: admin.id,
          classId: defaultClass.id,
        },
      })
    }

    console.log("Seed data created successfully!")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
