import type { StickyColor, Role } from "@/generated/prisma/client"

export type { StickyColor, Role }

export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  bio: string | null
  role: Role
}

export interface ClassInfo {
  id: string
  name: string
  description: string | null
  schoolName: string | null
  gradeYear: number | null
  endYear: number | null
  inviteCode: string
  memberCount: number
}

export interface Photo {
  id: string
  url: string
  caption: string | null
  takenAt: string | null
  uploadedAt: string
  rotation: number
  zIndex: number
  cropX: number
  cropY: number
  uploader: Pick<User, "id" | "name" | "avatar">
  likeCount: number
  commentCount: number
  isLiked: boolean
}

export interface PhotoComment {
  id: string
  content: string
  createdAt: string
  user: Pick<User, "id" | "name" | "avatar">
  replies?: PhotoComment[]
}

export interface Message {
  id: string
  content: string
  color: StickyColor
  createdAt: string
  rotation: number
  posX: number | null
  posY: number | null
  author: Pick<User, "id" | "name" | "avatar">
  likeCount: number
  replyCount: number
  isLiked: boolean
}

export interface MessageReply {
  id: string
  content: string
  createdAt: string
  user: Pick<User, "id" | "name" | "avatar">
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  eventTime: string
  coverImage: string | null
  createdAt: string
  creator: Pick<User, "id" | "name" | "avatar">
  commentCount: number
  attendeeCount: number
  isAttending: boolean
}

export interface EventComment {
  id: string
  content: string
  createdAt: string
  user: Pick<User, "id" | "name" | "avatar">
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
