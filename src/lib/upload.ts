import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadPhoto(
  file: File
): Promise<{ url: string; thumbnailUrl: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${uuidv4()}.webp`
  const thumbnailFilename = `${uuidv4()}-thumb.webp`

  const photosDir = path.join(UPLOAD_DIR, "photos")
  await mkdir(photosDir, { recursive: true })

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

  await writeFile(path.join(photosDir, filename), displayBuffer)
  await writeFile(path.join(photosDir, thumbnailFilename), thumbnailBuffer)

  return {
    url: `/uploads/photos/${filename}`,
    thumbnailUrl: `/uploads/photos/${thumbnailFilename}`,
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${uuidv4()}.webp`

  const avatarsDir = path.join(UPLOAD_DIR, "avatars")
  await mkdir(avatarsDir, { recursive: true })

  const avatarBuffer = await sharp(buffer)
    .resize(200, 200, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer()

  await writeFile(path.join(avatarsDir, filename), avatarBuffer)

  return `/uploads/avatars/${filename}`
}
