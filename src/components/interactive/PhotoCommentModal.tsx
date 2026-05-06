"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Heart, MessageCircle, Trash2, Maximize2 } from "lucide-react"
import type { Photo, PhotoComment } from "@/types"

interface PhotoCommentModalProps {
  photo: Photo | null
  onClose: () => void
  onComment?: (photoId: string, content: string, parentId?: string) => Promise<void>
  onLike?: (photoId: string) => Promise<void>
  onDelete?: (photoId: string) => Promise<void>
  currentUserId?: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!photo) return
    setLiked(photo.isLiked)
    setLikeCount(photo.likeCount)
    setIsLoading(true)
    fetch(`/api/photos/${photo.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .finally(() => setIsLoading(false))
  }, [photo])

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isFullscreen])

  const handleLike = async () => {
    if (!photo || isLiking) return
    setIsLiking(true)
    // Optimistic
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      if (onLike) await onLike(photo.id)
      else await fetch(`/api/photos/${photo.id}/like`, { method: "POST" })
    } catch {
      // revert on failure
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
      const data = await res.json()
      setComments(data)
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

  return (
    <>
      {isFullscreen && photo && createPortal(
        <motion.div
          key="fullscreen"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-sm z-[301]"
          >
            <X size={22} />
          </button>
          <img
            src={photo.url}
            alt={photo.caption || "照片"}
            className="max-h-[92vh] max-w-[92vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-amber-800 font-handwritten">
              {photo.caption || "照片详情"}
            </h2>
            <div className="flex items-center gap-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Photo */}
          <div className="p-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 flex justify-center">
              <img
                src={photo.url}
                alt={photo.caption || "照片"}
                className="max-w-full max-h-[55vh] object-contain vintage-filter"
              />
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute bottom-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-colors backdrop-blur-sm"
                title="全屏查看"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-amber-700">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-60"
              >
                <Heart
                  size={18}
                  className={liked ? "fill-red-500 text-red-500" : ""}
                />
                {likeCount}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle size={16} />
                {comments.length}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {isLoading && (
              <p className="text-center text-gray-400 py-4">加载中...</p>
            )}
            {!isLoading && comments.length === 0 && (
              <p className="text-center text-gray-400 py-4 font-handwritten">
                还没有评论，说点什么吧
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-sm font-bold shrink-0">
                    {comment.user.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-amber-800 text-sm">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-amber-900 text-sm mt-0.5">
                      {comment.content}
                    </p>
                    <button
                      onClick={() =>
                        setReplyTo(replyTo === comment.id ? null : comment.id)
                      }
                      className="text-xs text-amber-600 hover:text-amber-800 mt-1"
                    >
                      回复
                    </button>
                  </div>
                </div>

                {/* Nested replies */}
                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="flex gap-3 ml-11">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                      {reply.user.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-amber-800 text-sm">
                          {reply.user.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <p className="text-amber-900 text-sm mt-0.5">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Reply input */}
                {replyTo === comment.id && (
                  <div className="ml-11 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`回复 ${comment.user.name}...`}
                      className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      maxLength={500}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!newComment.trim() || isSubmitting}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comment input */}
          {!replyTo && (
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写条评论..."
                className="flex-1 px-4 py-2 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
                maxLength={500}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )}
  </>
  )
}
