"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { StickyNote, Doodle } from "@/components/scrapbook"
import { MessageDetailModal } from "@/components/interactive/MessageDetailModal"
import { useMessages } from "@/hooks/useMessages"
import { toast } from "@/lib/toast"
import Link from "next/link"
import { MessageSquare, Send, X, Heart } from "lucide-react"
import type { StickyColor, Message } from "@/types"

const colors: StickyColor[] = ["YELLOW", "PINK", "BLUE", "GREEN"]

const stickyBg: Record<StickyColor, string> = {
  YELLOW: "bg-sticky-yellow",
  PINK: "bg-sticky-pink",
  BLUE: "bg-sticky-blue",
  GREEN: "bg-sticky-green",
}

interface MessageBoardProps {
  composeOpen?: boolean
  onCloseCompose?: () => void
  limit?: number
  topLiked?: number
  maxPages?: number
}

export function MessageBoard({
  composeOpen = false,
  onCloseCompose,
  limit,
  topLiked,
  maxPages,
}: MessageBoardProps) {
  const { messages, mutate, toggleLike, addReply, loadMore, isLoadingMore, isReachingEnd } =
    useMessages(limit || topLiked || maxPages ? { limit, topLiked, maxPages } : {})
  const pathname = usePathname()
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState("")
  const [selectedColor, setSelectedColor] = useState<StickyColor>("YELLOW")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const portalTarget = typeof document === "undefined" ? null : document.body

  const handleDeleteMessage = async (id: string) => {
    await fetch(`/api/messages/${id}`, { method: "DELETE" })
    mutate()
  }

  const handleSubmit = async () => {
    if (!newMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          color: selectedColor,
        }),
      })

      if (res.ok) {
        setNewMessage("")
        mutate()
        onCloseCompose?.()
        toast.success("留言已发布")
      } else if (res.status === 401) {
        toast.error("请先登录")
      } else {
        toast.error("发布失败")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="messages" className="relative px-4 py-12 md:py-16">
      <Doodle type="smiley" className="absolute right-[10%] top-10 hidden md:block" size={40} />
      <Doodle type="arrow" className="absolute bottom-20 left-[8%] hidden md:block" size={35} />

      <motion.div
        className="mx-auto mb-8 flex max-w-3xl items-center gap-3 md:mb-10"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <MessageSquare className="text-amber-200/70" size={24} />
        <h2 className="font-brush text-2xl text-amber-100 md:text-3xl">
          大家的留言
        </h2>
        <span className="font-handwritten text-lg text-amber-300">★</span>
        {pathname !== "/messages" && (
          <Link
            href="/messages"
            className="ml-auto font-handwritten text-sm text-amber-400/80 transition-colors hover:text-amber-300"
          >
            查看全部 →
          </Link>
        )}
      </motion.div>

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {composeOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCloseCompose}
              >
                <motion.div
                  className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-md"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-[3px] border border-amber-900/20"
                    style={{
                      background: "rgba(255,220,140,0.55)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />

                  <div
                    className={`relative rounded-[2px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ${stickyBg[selectedColor]} sticky-fold sm:p-6`}
                  >
                    <button
                      onClick={onCloseCompose}
                      className="absolute right-2 top-2 text-amber-800/50 transition-colors hover:text-amber-900"
                      aria-label="关闭"
                    >
                      <X size={18} />
                    </button>

                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="写下你的留言..."
                      autoFocus
                      className="min-h-[120px] w-full resize-none bg-transparent font-handwritten text-lg text-amber-900 outline-none placeholder:text-amber-700/40 sm:min-h-[130px] sm:text-xl"
                      maxLength={200}
                    />

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-900/10 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="mr-1 font-handwritten text-xs text-amber-800/50">
                          颜色
                        </span>
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`h-5 w-5 rounded-full border-2 transition-transform ${
                              stickyBg[color]
                            } ${
                              selectedColor === color
                                ? "scale-125 border-amber-800"
                                : "border-amber-800/30 hover:scale-110"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={!newMessage.trim() || isSubmitting}
                        className="flex items-center gap-2 rounded bg-amber-700 px-4 py-1.5 font-handwritten text-sm text-amber-50 shadow-sm transition-colors hover:bg-amber-800 disabled:opacity-40"
                      >
                        <Send size={14} />
                        {isSubmitting ? "发布中..." : "贴上去"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalTarget
        )}

      {messages.length > 0 && (
        <div className="mx-auto hidden max-w-6xl md:block">
          <div
            className="relative overflow-hidden rounded-2xl p-9"
            style={{
              background: "rgba(38, 22, 10, 0.72)",
              boxShadow:
                "inset 0 2px 15px rgba(0,0,0,.35), 0 5px 20px rgba(0,0,0,.25)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,.02) 0%, transparent 50%)",
              }}
            />
            <div className="relative grid grid-cols-5 gap-[18px]">
              {messages.map((msg, i) => {
                const tiltMap = [-3, 2, -2, 3, 1]
                const offsetMap = [0, 12, 0, 8, 0]
                const tilt = tiltMap[i % 5]
                const marginTop = offsetMap[i % 5]
                return (
                  <div key={msg.id} className="min-w-0" style={{ marginTop }}>
                    <motion.div
                      className={`relative cursor-pointer rounded-lg px-3 pb-[18px] pt-[18px] shadow-[0_4px_15px_rgba(0,0,0,.2)] ${stickyBg[msg.color]}`}
                      style={{ transform: `rotate(${tilt}deg)` }}
                      whileHover={{ y: -5, rotate: 0, zIndex: 20 }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <span
                        className="absolute -top-3 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 38% 32%, #ff8a80, #c62828)",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.35)",
                        }}
                      />

                      <p className="min-h-[80px] whitespace-pre-wrap break-words font-handwritten text-[15px] leading-[1.5] text-amber-900">
                        {msg.content}
                      </p>

                      {msg.author && (
                        <p className="mt-2 text-right text-[12px] text-stone-600">
                          — {msg.author.name}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(msg.id)
                          }}
                          className="flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-red-500"
                        >
                          <Heart
                            size={13}
                            className={msg.isLiked ? "fill-red-500 text-red-500" : "text-red-400"}
                          />
                          {msg.likeCount > 0 && <span>{msg.likeCount}</span>}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMessage(msg)
                          }}
                          className="text-xs text-stone-600 transition-colors hover:text-stone-900"
                        >
                          回复{msg.replyCount ? ` (${msg.replyCount})` : ""}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 md:hidden">
        {messages.map((msg) => (
          <div key={msg.id}>
            <StickyNote
              content={msg.content}
              color={msg.color}
              rotation={msg.rotation}
              author={msg.author}
              likeCount={msg.likeCount}
              replyCount={msg.replyCount}
              isLiked={msg.isLiked}
              onLike={() => toggleLike(msg.id)}
              onReply={() => setSelectedMessage(msg)}
              onClick={() => setSelectedMessage(msg)}
            />
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="py-16 text-center">
          <MessageSquare className="mx-auto mb-4 text-amber-200/40" size={48} />
          <p className="text-xl font-handwritten text-amber-100/60">
            还没有留言，写下第一句吧
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-6 text-center">
          {!isReachingEnd ? (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="rounded-full bg-amber-100/15 px-5 py-2 font-handwritten text-amber-100 transition-colors hover:bg-amber-100/25 disabled:opacity-50"
            >
              {isLoadingMore ? "加载中..." : "加载更多"}
            </button>
          ) : (
            <p className="text-sm font-handwritten text-amber-200/50">
              所有留言都在这里了
            </p>
          )}
        </div>
      )}

      {portalTarget &&
        createPortal(
          <MessageDetailModal
            key={selectedMessage?.id ?? "message-detail"}
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onLike={toggleLike}
            onReply={async (id, content, parentId) => {
              await addReply(id, content, parentId)
            }}
            onDelete={handleDeleteMessage}
            currentUserId={session?.user?.id}
          />,
          portalTarget
        )}
    </section>
  )
}
