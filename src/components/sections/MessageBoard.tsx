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

export function MessageBoard({ composeOpen = false, onCloseCompose, limit, topLiked, maxPages }: MessageBoardProps) {
  const { messages, mutate, toggleLike, addReply, loadMore, isLoadingMore, isReachingEnd } = useMessages(
    limit || topLiked || maxPages ? { limit, topLiked, maxPages } : {}
  )
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
    <section id="messages" className="relative py-16 px-4">
      <Doodle type="smiley" className="absolute top-10 right-[10%]" size={40} />
      <Doodle type="arrow" className="absolute bottom-20 left-[8%]" size={35} />

      <motion.div
        className="max-w-3xl mx-auto flex items-center gap-3 mb-10"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <MessageSquare className="text-amber-200/70" size={24} />
        <h2 className="font-brush text-2xl md:text-3xl text-amber-100">
          大家的留言
        </h2>
        <span className="font-handwritten text-amber-300 text-lg">☺</span>
        {pathname !== "/messages" && (
          <Link
            href="/messages"
            className="ml-auto font-handwritten text-sm text-amber-400/80 hover:text-amber-300 transition-colors"
          >
            查看全部 →
          </Link>
        )}
      </motion.div>

      {/* Message compose modal via portal */}
      {portalTarget && createPortal(
        <AnimatePresence>
          {composeOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseCompose}
            >
              <motion.div
                className="relative w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Masking tape top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-[3px] z-10 border border-amber-900/20"
                  style={{ background: "rgba(255,220,140,0.55)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />

                <div className={`relative p-6 ${stickyBg[selectedColor]} shadow-[0_8px_32px_rgba(0,0,0,0.45)] sticky-fold`}
                  style={{ borderRadius: "2px" }}>
                  <button
                    onClick={onCloseCompose}
                    className="absolute top-2 right-2 text-amber-800/50 hover:text-amber-900 transition-colors"
                    aria-label="关闭"
                  >
                    <X size={18} />
                  </button>

                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="写下你的留言..."
                    autoFocus
                    className="w-full bg-transparent font-handwritten text-xl text-amber-900 placeholder:text-amber-700/40 resize-none outline-none min-h-[130px]"
                    maxLength={200}
                  />

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-900/10">
                    <div className="flex gap-2 items-center">
                      <span className="font-handwritten text-amber-800/50 text-xs mr-1">颜色</span>
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-5 h-5 rounded-full ${stickyBg[color]} border-2 transition-transform ${
                            selectedColor === color
                              ? "border-amber-800 scale-125"
                              : "border-amber-800/30 hover:scale-110"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!newMessage.trim() || isSubmitting}
                      className="flex items-center gap-2 px-4 py-1.5 bg-amber-700 text-amber-50 rounded hover:bg-amber-800 transition-colors disabled:opacity-40 font-handwritten text-sm shadow-sm"
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

      {/* Notes board (desktop) — dark navy board with tape-crossed notes */}
      {messages.length > 0 && (
        <div className="hidden md:block max-w-6xl mx-auto">
          <div
            className="relative rounded-2xl p-9 overflow-hidden"
            style={{
              background: "rgba(38, 22, 10, 0.72)",
              boxShadow:
                "inset 0 2px 15px rgba(0,0,0,.35), 0 5px 20px rgba(0,0,0,.25)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,.02) 0%, transparent 50%)",
              }}
            />
            <div className="relative grid grid-cols-5 gap-[18px]">
              {messages.map((msg, i) => {
                // Mimic reference: alternating tilt + slight vertical offset
                const tiltMap = [-3, 2, -2, 3, 1]
                const offsetMap = [0, 12, 0, 8, 0]
                const tilt = tiltMap[i % 5]
                const marginTop = offsetMap[i % 5]
                return (
                  <div
                    key={msg.id}
                    className="min-w-0"
                    style={{ marginTop }}
                  >
                    <motion.div
                      className={`relative px-3 pt-[18px] pb-[18px] rounded-lg ${stickyBg[msg.color]} shadow-[0_4px_15px_rgba(0,0,0,.2)] cursor-pointer`}
                      style={{ transform: `rotate(${tilt}deg)` }}
                      whileHover={{ y: -5, rotate: 0, zIndex: 20 }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedMessage(msg)}
                    >
                      {/* Thumbtack */}
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full z-10"
                        style={{
                          background: "radial-gradient(circle at 38% 32%, #ff8a80, #c62828)",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.35)",
                        }}
                      />

                      <p className="font-handwritten text-[15px] text-amber-900 leading-[1.5] whitespace-pre-wrap break-words min-h-[80px]">
                        {msg.content}
                      </p>

                      {msg.author && (
                        <p className="text-right mt-2 text-[12px] text-stone-600">
                          —— {msg.author.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(msg.id) }}
                          className="flex items-center gap-1 text-stone-500 text-xs hover:text-red-500 transition-colors"
                        >
                          <Heart
                            size={13}
                            className={msg.isLiked ? "fill-red-500 text-red-500" : "text-red-400"}
                          />
                          {msg.likeCount > 0 && <span>{msg.likeCount}</span>}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedMessage(msg) }}
                          className="text-stone-600 text-xs hover:text-stone-900 transition-colors"
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

      {/* Mobile: flow layout */}
      <div className="md:hidden space-y-4">
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
          <MessageSquare className="mx-auto text-amber-200/40 mb-4" size={48} />
          <p className="font-handwritten text-amber-100/60 text-xl">
            还没有留言，写下第一句吧
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="text-center mt-6">
          {!isReachingEnd ? (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="px-5 py-2 bg-amber-100/15 text-amber-100 rounded-full hover:bg-amber-100/25 transition-colors font-handwritten disabled:opacity-50"
            >
              {isLoadingMore ? "加载中..." : "加载更多"}
            </button>
          ) : (
            <p className="font-handwritten text-amber-200/50 text-sm">
              所有留言都在这里了
            </p>
          )}
        </div>
      )}

      {portalTarget && createPortal(
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
