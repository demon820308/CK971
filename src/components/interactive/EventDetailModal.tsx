"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Calendar, MapPin, Trash2, Users, CheckCircle2 } from "lucide-react"
import type { Event, EventComment, User } from "@/types"

interface EventDetailModalProps {
  event: Event | null
  onClose: () => void
  onDelete?: (eventId: string) => Promise<void>
  onRsvp?: (eventId: string) => Promise<void>
  currentUserId?: string
}

export function EventDetailModal({
  event,
  onClose,
  onDelete,
  onRsvp,
  currentUserId,
}: EventDetailModalProps) {
  const [comments, setComments] = useState<EventComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [nestedReplyText, setNestedReplyText] = useState("")
  const [attending, setAttending] = useState(false)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [isRsvping, setIsRsvping] = useState(false)
  const [attendees, setAttendees] = useState<Pick<User, "id" | "name" | "avatar">[]>([])
  const [showAttendees, setShowAttendees] = useState(false)

  const fetchAttendees = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/rsvp`)
    if (res.ok) {
      const data = await res.json()
      setAttendees(data.attendees ?? [])
    }
  }

  useEffect(() => {
    if (!event) return
    setAttending(event.isAttending)
    setAttendeeCount(event.attendeeCount)
    setAttendees([])
    setShowAttendees(false)
    setIsLoading(true)
    fetch(`/api/events/${event.id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false))
  }, [event])

  const handleRsvp = async () => {
    if (!event || isRsvping) return
    setIsRsvping(true)
    const prev = attending
    setAttending(!prev)
    setAttendeeCount((c) => c + (prev ? -1 : 1))
    try {
      if (onRsvp) {
        await onRsvp(event.id)
      } else {
        await fetch(`/api/events/${event.id}/rsvp`, { method: "POST" })
      }
      await fetchAttendees(event.id)
    } catch {
      setAttending(prev)
      setAttendeeCount((c) => c + (prev ? 1 : -1))
    } finally {
      setIsRsvping(false)
    }
  }

  const handleSubmit = async (parentId?: string) => {
    if (!event || isSubmitting) return
    const text = parentId ? nestedReplyText : newComment
    if (!text.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/events/${event.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), parentId: parentId || null }),
      })
      if (res.ok) {
        if (parentId) {
          setNestedReplyText("")
          setReplyingTo(null)
        } else {
          setNewComment("")
        }
        const list = await fetch(`/api/events/${event.id}/comments`).then((r) => r.json())
        setComments(Array.isArray(list) ? list : [])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!event || isDeleting) return
    if (!confirm("确认删除这个活动？")) return
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(event.id)
      } else {
        await fetch(`/api/events/${event.id}`, { method: "DELETE" })
      }
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!event) return null
  if (typeof document === "undefined") return null

  const canDelete = currentUserId && event.creator?.id === currentUserId

  const renderComment = (comment: EventComment, depth = 0) => (
    <div key={comment.id} className={depth > 0 ? "ml-11" : ""}>
      <div className="flex gap-3">
        <div className={`rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0 ${depth > 0 ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"}`}>
          {comment.user.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-amber-800 text-sm">{comment.user.name}</span>
            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="text-amber-900 text-sm mt-0.5">{comment.content}</p>
          {depth === 0 && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-amber-600 hover:text-amber-800 mt-1"
            >
              {replyingTo === comment.id ? "取消" : "回复"}
            </button>
          )}
          {depth === 0 && replyingTo === comment.id && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={nestedReplyText}
                onChange={(e) => setNestedReplyText(e.target.value)}
                placeholder={`回复 ${comment.user.name}...`}
                className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-handwritten"
                maxLength={200}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(comment.id)}
              />
              <button
                onClick={() => handleSubmit(comment.id)}
                disabled={!nestedReplyText.trim() || isSubmitting}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((r) => renderComment(r, depth + 1))}
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
          className="w-full max-w-2xl bg-paper-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-amber-200">
            <h2 className="font-brush text-2xl text-amber-800 truncate">
              {event.title}
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

          {/* Event info */}
          <div className="p-4 border-b border-amber-100">
            <div className="flex flex-wrap items-center gap-4 text-amber-700 mb-2">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span className="font-handwritten">
                  {new Date(event.eventTime).toLocaleString("zh-CN", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span className="font-handwritten">{event.location}</span>
                </div>
              )}
            </div>
            {event.description && (
              <p className="font-handwritten text-lg text-amber-800 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              {event.creator && (
                <p className="text-xs text-amber-600">
                  由 {event.creator.name} 创建
                </p>
              )}
              <button
                onClick={handleRsvp}
                disabled={isRsvping || !currentUserId}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-handwritten transition-colors disabled:opacity-50 ${
                  attending
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                {attending ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Users size={16} />
                )}
                {attending ? "已报名" : "我要参加"}
                {attendeeCount > 0 && (
                  <span className="ml-1 text-xs">({attendeeCount})</span>
                )}
              </button>
            </div>

            {/* Attendee list toggle */}
            {attendeeCount > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    const next = !showAttendees
                    setShowAttendees(next)
                    if (next && attendees.length === 0) fetchAttendees(event.id)
                  }}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <Users size={13} />
                  <span>{showAttendees ? "收起" : "查看报名名单"} ({attendeeCount} 人)</span>
                </button>
                {showAttendees && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attendees.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"
                      >
                        <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center text-amber-900 text-[10px] font-bold">
                          {u.name[0]}
                        </div>
                        <span className="text-xs text-amber-800 font-handwritten">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <p className="text-sm text-amber-700 font-medium">
              评论 ({comments.length})
            </p>
            {isLoading && (
              <p className="text-center text-gray-400 py-4">加载中...</p>
            )}
            {!isLoading && comments.length === 0 && (
              <p className="text-center text-gray-400 py-4 font-handwritten">
                还没有评论，说点什么吧
              </p>
            )}
            {comments.map((comment) => renderComment(comment))}
          </div>

          {/* Comment input */}
          <div className="p-4 border-t border-amber-200 flex gap-2">
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
              onClick={() => handleSubmit()}
              disabled={!newComment.trim() || isSubmitting}
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
