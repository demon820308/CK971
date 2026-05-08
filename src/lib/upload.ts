import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import { put } from "@vercel/blob"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const MAX_FILE_SIZE = 10 * 1024 * 1024

function hasBlobCredentials() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

async function writeLocalAsset(folder: string, name: string, buffer: Buffer) {
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(dir, { recursive: true })
  const fullPath = path.join(dir, name)
  await writeFile(fullPath, buffer)
  return `/uploads/${folder}/${name}`
}

async function saveAsset(folder: string, name: string, buffer: Buffer) {
  if (hasBlobCredentials()) {
    const result = await put(`${folder}/${name}`, buffer, { access: "public" })
    return result.url
  }

  return writeLocalAsset(folder, name, buffer)
}

export async function uploadPhoto(
  file: File
): Promise<{ url: string; thumbnailUrl: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const id = uuidv4()

  const displayBuffer = await sharp(buffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const thumbnailBuffer = await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()

  const [url, thumbnailUrl] = await Promise.all([
    saveAsset("photos", `${id}.webp`, displayBuffer),
    saveAsset("photos", `${id}-thumb.webp`, thumbnailBuffer),
  ])

  return { url, thumbnailUrl }
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

  return saveAsset("avatars", `${id}.webp`, avatarBuffer)
}
