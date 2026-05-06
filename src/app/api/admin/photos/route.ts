import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const photos = await prisma.photo.findMany({
    select: {
      id: true,
      url: true,
      caption: true,
      uploadedAt: true,
      uploader: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { uploadedAt: "desc" },
  })

  return NextResponse.json(photos)
}
