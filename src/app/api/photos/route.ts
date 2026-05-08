import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadPhoto } from "@/lib/upload"
import type { StickyColor } from "@/generated/prisma/client"

type PhotoRecord = {
  id: string
  url: string
  caption: string | null
  takenAt: Date | null
  uploadedAt: Date
  rotation: number
  zIndex: number
  cropX: number
  cropY: number
  uploader: { id: string; name: string; avatar: string | null }
  _count: { likes: number; comments: number }
  likes: { id: string }[]
  color?: StickyColor
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const topLiked = parseInt(searchParams.get("topLiked") ?? "0")

  const session = await auth()
  const classId = (session?.user as { classId?: string })?.classId

  if (!classId) {
    const defaultClass = await prisma.class.findFirst()
    if (!defaultClass) {
      return NextResponse.json({ items: [], nextCursor: null, hasMore: false })
    }
    return getPhotos(defaultClass.id, cursor, limit, session?.user?.id, topLiked)
  }

  return getPhotos(classId, cursor, limit, session?.user?.id, topLiked)
}

function formatPhoto(photo: PhotoRecord, userId?: string) {
  return {
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    takenAt: photo.takenAt?.toISOString() ?? null,
    uploadedAt: photo.uploadedAt.toISOString(),
    rotation: photo.rotation,
    zIndex: photo.zIndex,
    cropX: photo.cropX,
    cropY: photo.cropY,
    uploader: photo.uploader,
    likeCount: photo._count.likes,
    commentCount: photo._count.comments,
    isLiked: userId ? photo.likes.length > 0 : false,
  }
}

async function getPhotos(
  classId: string,
  cursor: string | null,
  limit: number,
  userId?: string,
  topLiked = 0
) {
  const includeClause = {
    uploader: { select: { id: true, name: true, avatar: true } },
    likes: userId ? { where: { userId }, select: { id: true } } : false as const,
    _count: { select: { likes: true, comments: true } },
  }

  // First page with featured top-liked section
  if (topLiked > 0 && !cursor) {
    // Fetch all photos lightweight (id + like count + date) for JS-side sort
    const allSlim = await prisma.photo.findMany({
      where: { classId },
      select: { id: true, uploadedAt: true, _count: { select: { likes: true } } },
    })
    // Sort: likes desc, then date desc as tiebreaker
    allSlim.sort((a, b) =>
      b._count.likes !== a._count.likes
        ? b._count.likes - a._count.likes
        : b.uploadedAt.getTime() - a.uploadedAt.getTime()
    )
    const featuredIds = allSlim.slice(0, topLiked).map((p) => p.id)
    const featuredIdSet = new Set(featuredIds)
    // Rest sorted by newest upload date
    const restSlim = allSlim
      .filter((p) => !featuredIdSet.has(p.id))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    const restIds = restSlim.slice(0, limit - topLiked).map((p) => p.id)
    const hasMore = allSlim.length > limit

    // Fetch full data in parallel
    const [featuredRaw, restRaw] = await Promise.all([
      prisma.photo.findMany({ where: { id: { in: featuredIds } }, include: includeClause }),
      prisma.photo.findMany({ where: { id: { in: restIds } }, include: includeClause }),
    ])
    // Re-apply the sorted order
    const fMap = new Map(featuredRaw.map((p) => [p.id, p]))
    const rMap = new Map(restRaw.map((p) => [p.id, p]))
    const featured = featuredIds.map((id) => fMap.get(id)!).filter(Boolean)
    const rest = restIds.map((id) => rMap.get(id)!).filter(Boolean)

    return NextResponse.json({
      items: [...featured, ...rest].map((p) => formatPhoto(p, userId)),
      nextCursor: hasMore ? allSlim[limit].id : null,
      hasMore,
    })
  }

  // Normal cursor-based pagination
  const photos = await prisma.photo.findMany({
    where: { classId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { uploadedAt: "desc" },
    include: includeClause,
  })
  const hasMore = photos.length > limit
  return NextResponse.json({
    items: photos.slice(0, limit).map((p) => formatPhoto(p, userId)),
    nextCursor: hasMore ? photos[limit].id : null,
    hasMore,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const classId = (session.user as { classId?: string })?.classId
  if (!classId) {
    return NextResponse.json({ error: "未加入班级" }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const caption = formData.get("caption") as string | null
  const cropX = parseFloat(formData.get("cropX") as string ?? "50")
  const cropY = parseFloat(formData.get("cropY") as string ?? "50")

  if (!file) {
    return NextResponse.json({ error: "请选择图片" }, { status: 400 })
  }

  try {
    const { url } = await uploadPhoto(file)

    const photo = await prisma.photo.create({
      data: {
        url,
        caption: caption || null,
        uploaderId: session.user.id,
        classId,
        rotation: (Math.random() - 0.5) * 16, // -8 to 8 degrees
        zIndex: Math.floor(Math.random() * 100),
        cropX,
        cropY,
      },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      uploadedAt: photo.uploadedAt.toISOString(),
      rotation: photo.rotation,
      zIndex: photo.zIndex,
      cropX: photo.cropX,
      cropY: photo.cropY,
      uploader: photo.uploader,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
    })
  } catch {
    return NextResponse.json({ error: "上传失败" }, { status: 500 })
  }
}
