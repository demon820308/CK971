"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Heart, MessageCircle, Trash2, Maximize2 } from "lucide-react"
import { toast } from "@/lib/toast"
import type { Photo, PhotoComment } from "@/types"

interface PhotoCommentModalProps {
  photo: Photo | null
  onClose: () => void
  onComment?: (photoId: string, content: string, parentId?: string) => Promise<void>
  onLike?: (photoId: string) => Promise<void>
  onDelete?: (photoId: string) => Promise<void>
  currentUserId?: string
}

async function readJsonArray<T>(res: Response): Promise<T[]> {
  const text = await res.text()
  if (!res.ok || !text.trim()) return []

  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function PhotoCommentModal({
  photo,
  onClose,
  onComment,
  onLike,
  onDelete,
  currentUserId,
}: PhotoCommentModalProps) {
  const [comments, setComments] = useState<PhotoComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [liked, setLiked] = useState(() => photo?.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(() => photo?.likeCount ?? 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!photo) return
    fetch(`/api/photos/${photo.id}/comments`)
      .then((res) => readJsonArray<PhotoComment>(res))
      .then(setComments)
      .finally(() => setIsLoading(false))
  }, [photo])

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullscreen])

  const handleLike = async () => {
    if (!photo || isLiking) return
    setIsLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      if (onLike) await onLike(photo.id)
      else await fetch(`/api/photos/${photo.id}/like`, { method: "POST" })
    } catch {
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmit = async () => {
    if (!photo || !newComment.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (onComment) {
        await onComment(photo.id, newComment.trim(), replyTo ?? undefined)
      } else {
        await fetch(`/api/photos/${photo.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment.trim(), parentId: replyTo }),
        })
      }
      setNewComment("")
      setReplyTo(null)
      const res = await fetch(`/api/photos/${photo.id}/comments`)
      const data = await readJsonArray<PhotoComment>(res)
      setComments(data)
      toast.success(replyTo ? "回复已发布" : "评论已发布")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!photo) return
    if (!confirm("确认删除这张照片？")) return
    if (onDelete) {
      await onDelete(photo.id)
    } else {
      await fetch(`/api/photos/${photo.id}`, { method: "DELETE" })
    }
    onClose()
  }

  if (!photo) return null
  if (typeof document === "undefined") return null

  const canDelete = currentUserId && photo.uploader?.id === currentUserId

  const renderComment = (comment: PhotoComment) => (
    <div key={comment.id} className="space-y-2">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">
          {comment.user.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm text-amber-800">{comment.user.name}</span>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-amber-900 break-words">{comment.content}</p>
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="mt-1 text-xs text-amber-600 transition-colors hover:text-amber-800"
          >
            回复
          </button>
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="ml-11 flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
            {reply.user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-sm text-amber-800">
                {reply.user.name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
            <p className="mt-0.5 break-words text-sm text-amber-900">{reply.content}</p>
          </div>
        </div>
      ))}

      {replyTo === comment.id && (
        <div className="ml-11 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`回复 ${comment.user.name}...`}
            className="min-w-0 flex-1 rounded-lg border border-amber-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            maxLength={500}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  )

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-3 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-w-4xl md:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-3 sm:p-4">
            <h2 className="font-handwritten text-base text-amber-800 sm:text-lg">
              照片详情
            </h2>
            <div className="flex items-center gap-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="relative flex justify-center overflow-hidden rounded-xl bg-gray-100">
              <img
                src={photo.url}
                alt={photo.caption || "照片"}
                className="max-h-[38dvh] max-w-full object-contain sm:max-h-[50vh] vintage-filter"
              />
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute bottom-2 right-2 rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                title="全屏查看"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-amber-700">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 transition-colors hover:text-red-500 disabled:opacity-60"
              >
                <Heart size={18} className={liked ? "fill-red-500 text-red-500" : ""} />
                {likeCount}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle size={16} />
                {comments.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 sm:px-4">
            {isLoading && <p className="py-4 text-center text-gray-400">加载中...</p>}
            {!isLoading && comments.length === 0 && (
              <p className="py-4 text-center font-handwritten text-gray-400">
                还没有评论，说点什么吧
              </p>
            )}
            {comments.map((comment) => renderComment(comment))}
          </div>

          {!replyTo && (
            <div className="flex gap-2 border-t p-3 sm:p-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写条评论..."
                className="min-w-0 flex-1 rounded-lg border border-amber-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
                maxLength={500}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
