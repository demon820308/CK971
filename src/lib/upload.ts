import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import { put } from "@vercel/blob"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadPhoto(
  file: File
): Promise<{ url: string; thumbnailUrl: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const id = uuidv4()

  // Generate display version (800px wide)
  const displayBuffer = await sharp(buffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  // Generate thumbnail (400px wide)
  const thumbnailBuffer = await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()

  const [displayResult, thumbnailResult] = await Promise.all([
    put(`photos/${id}.webp`, displayBuffer, { access: "public" }),
    put(`photos/${id}-thumb.webp`, thumbnailBuffer, { access: "public" }),
  ])

  return {
    url: displayResult.url,
    thumbnailUrl: thumbnailResult.url,
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const id = uuidv4()

  const avatarBuffer = await sharp(buffer)
    .resize(200, 200, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer()

  const result = await put(`avatars/${id}.webp`, avatarBuffer, { access: "public" })

  return result.url
}
