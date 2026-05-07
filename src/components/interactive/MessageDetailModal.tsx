"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Heart, Trash2 } from "lucide-react"
import type { Message, MessageReply, StickyColor } from "@/types"

interface MessageDetailModalProps {
  message: Message | null
  onClose: () => void
  onLike?: (id: string) => Promise<void>
  onReply?: (id: string, content: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  currentUserId?: string
}

const stickyBg: Record<StickyColor, string> = {
  YELLOW: "bg-sticky-yellow",
  PINK: "bg-sticky-pink",
  BLUE: "bg-sticky-blue",
  GREEN: "bg-sticky-green",
}

export function MessageDetailModal({
  message,
  onClose,
  onLike,
  onReply,
  onDelete,
  currentUserId,
}: MessageDetailModalProps) {
  const [replies, setReplies] = useState<MessageReply[]>([])
  const [newReply, setNewReply] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [nestedReplyText, setNestedReplyText] = useState("")

  useEffect(() => {
    if (!message) return
    setLiked(message.isLiked)
    setLikeCount(message.likeCount)
    setIsLoading(true)
    fetch(`/api/messages/${message.id}/replies`)
      .then((res) => res.json())
      .then((data) => setReplies(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false))
  }, [message])

  const handleLike = async () => {
    if (!message || isLiking) return
    setIsLiking(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      if (onLike) await onLike(message.id)
      else await fetch(`/api/messages/${message.id}/like`, { method: "POST" })
    } catch {
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmit = async (parentId?: string) => {
    if (!message || isSubmitting) return
    const text = parentId ? nestedReplyText : newReply
    if (!text.trim()) return
    setIsSubmitting(true)
    try {
      if (onReply) {
        await onReply(message.id, text.trim())
      } else {
        await fetch(`/api/messages/${message.id}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim(), parentId: parentId || null }),
        })
      }
      if (parentId) {
        setNestedReplyText("")
        setReplyingTo(null)
      } else {
        setNewReply("")
      }
      const list = await fetch(`/api/messages/${message.id}/replies`).then((r) =>
        r.json()
      )
      setReplies(Array.isArray(list) ? list : [])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!message || isDeleting) return
    if (!confirm("确认删除这条留言？")) return
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(message.id)
      } else {
        await fetch(`/api/messages/${message.id}`, { method: "DELETE" })
      }
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!message) return null
  if (typeof document === "undefined") return null

  const canDelete = currentUserId && message.author?.id === currentUserId

  const renderReply = (reply: MessageReply, depth = 0) => (
    <div key={reply.id} className={depth > 0 ? "ml-11" : ""}>
      <div className="flex gap-3">
        <div className={`rounded-full flex items-center justify-center font-bold shrink-0 ${depth > 0 ? "w-7 h-7 text-xs bg-amber-100 text-amber-700" : "w-8 h-8 text-sm bg-amber-200 text-amber-800"}`}>
          {reply.user.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-amber-800 text-sm">{reply.user.name}</span>
            <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="text-amber-900 text-sm mt-0.5">{reply.content}</p>
          {depth === 0 && (
            <button
              onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
              className="text-xs text-amber-600 hover:text-amber-800 mt-1"
            >
              {replyingTo === reply.id ? "取消" : "回复"}
            </button>
          )}
          {depth === 0 && replyingTo === reply.id && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={nestedReplyText}
                onChange={(e) => setNestedReplyText(e.target.value)}
                placeholder={`回复 ${reply.user.name}...`}
                className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(reply.id)}
              />
              <button
                onClick={() => handleSubmit(reply.id)}
                disabled={!nestedReplyText.trim() || isSubmitting}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          )}
          {reply.replies && reply.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {reply.replies.map((r) => renderReply(r, depth + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(
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
          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-handwritten text-lg text-amber-800">
              留言详情
            </h2>
            <div className="flex items-center gap-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
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

          {/* Sticky note */}
          <div className="p-4">
            <div className={`p-4 rounded-lg ${stickyBg[message.color]} shadow-md`}>
              <p className="font-handwritten text-lg text-amber-900 whitespace-pre-wrap break-words">
                {message.content}
              </p>
              {message.author && (
                <p className="font-handwritten text-sm text-amber-700 text-right mt-3">
                  —— {message.author.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 text-amber-700 hover:text-red-500 transition-colors disabled:opacity-60"
              >
                <Heart
                  size={18}
                  className={liked ? "fill-red-500 text-red-500" : ""}
                />
                {likeCount}
              </button>
              <span className="text-xs text-gray-400">
                {new Date(message.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>

          {/* Replies */}
          <div className="flex-1 overflow-y-auto px-4 pb-3 border-t pt-3 space-y-3">
            <p className="text-sm text-amber-700 font-medium">
              回复 ({replies.length})
            </p>
            {isLoading && (
              <p className="text-center text-gray-400 py-4">加载中...</p>
            )}
            {!isLoading && replies.length === 0 && (
              <p className="text-center text-gray-400 py-4 font-handwritten">
                还没有回复
              </p>
            )}
            {replies.map((reply) => renderReply(reply))}
          </div>

          {/* Reply input */}
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="写条回复..."
              className="flex-1 px-4 py-2 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
              maxLength={200}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!newReply.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
