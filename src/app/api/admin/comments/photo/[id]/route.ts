import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/adminAuth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  await prisma.photoComment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
