"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Heart, Trash2 } from "lucide-react"
import { toast } from "@/lib/toast"
import type { Message, MessageReply, StickyColor } from "@/types"

interface MessageDetailModalProps {
  message: Message | null
  onClose: () => void
  onLike?: (id: string) => Promise<void>
  onReply?: (id: string, content: string, parentId?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  currentUserId?: string
}

const stickyBg: Record<StickyColor, string> = {
  YELLOW: "bg-sticky-yellow",
  PINK: "bg-sticky-pink",
  BLUE: "bg-sticky-blue",
  GREEN: "bg-sticky-green",
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
  const [isLoading, setIsLoading] = useState(true)
  const [liked, setLiked] = useState(() => message?.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(() => message?.likeCount ?? 0)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [nestedReplyText, setNestedReplyText] = useState("")

  useEffect(() => {
    if (!message) return
    fetch(`/api/messages/${message.id}/replies`)
      .then((res) => readJsonArray<MessageReply>(res))
      .then(setReplies)
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
        await onReply(message.id, text.trim(), parentId)
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
        readJsonArray<MessageReply>(r)
      )
      setReplies(list)
      toast.success("回复已发布")
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

  const replyTotal = replies.reduce((total, reply) => total + 1 + (reply.replies?.length ?? 0), 0)

  const renderReply = (reply: MessageReply) => (
    <div key={reply.id} className="space-y-2">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">
          {reply.user.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-amber-800">{reply.user.name}</span>
            <span className="text-xs text-gray-400">
              {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-amber-900">{reply.content}</p>
          <button
            onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
            className="mt-1 text-xs text-amber-600 hover:text-amber-800"
          >
            {replyingTo === reply.id ? "取消" : "回复"}
          </button>
          {replyingTo === reply.id && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={nestedReplyText}
                onChange={(e) => setNestedReplyText(e.target.value)}
                placeholder={`回复 ${reply.user.name}...`}
                className="min-w-0 flex-1 rounded-lg border border-amber-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(reply.id)}
              />
              <button
                onClick={() => handleSubmit(reply.id)}
                disabled={!nestedReplyText.trim() || isSubmitting}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      {reply.replies && reply.replies.length > 0 && (
        <div className="space-y-2">
          {reply.replies.map((r) => (
            <div key={r.id} className="ml-11 flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {r.user.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-amber-800">{r.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-amber-900">{r.content}</p>
              </div>
            </div>
          ))}
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
          className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-w-md md:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b p-3 md:p-4">
            <h2 className="font-handwritten text-base text-amber-800 md:text-lg">
              留言详情
            </h2>
            <div className="flex items-center gap-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-full p-2 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4">
            <div className={`rounded-lg p-4 ${stickyBg[message.color]} shadow-md`}>
              <p className="whitespace-pre-wrap break-words font-handwritten text-base text-amber-900 md:text-lg">
                {message.content}
              </p>
              {message.author && (
                <p className="mt-3 text-right font-handwritten text-sm text-amber-700">
                  — {message.author.name}
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 text-amber-700 transition-colors hover:text-red-500 disabled:opacity-60"
              >
                <Heart size={18} className={liked ? "fill-red-500 text-red-500" : ""} />
                {likeCount}
              </button>
              <span className="text-xs text-gray-400">
                {new Date(message.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto border-t px-3 pb-3 pt-3 md:px-4">
            <p className="text-sm font-medium text-amber-700">回复 ({replyTotal})</p>
            {isLoading && <p className="py-4 text-center text-gray-400">加载中...</p>}
            {!isLoading && replies.length === 0 && (
              <p className="py-4 text-center font-handwritten text-gray-400">
                还没有回复
              </p>
            )}
            {replies.map((reply) => renderReply(reply))}
          </div>

          <div className="flex gap-2 border-t p-3 md:p-4">
            <input
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="写条回复..."
              className="min-w-0 flex-1 rounded-lg border border-amber-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
              maxLength={200}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!newReply.trim() || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
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
