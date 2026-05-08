"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Doodle, MaskingTape } from "@/components/scrapbook"
import { useEvents } from "@/hooks/useEvents"
import { toast } from "@/lib/toast"
import { EventDetailModal } from "@/components/interactive/EventDetailModal"
import Link from "next/link"
import { Calendar, MapPin, MessageCircle, Users, CheckCircle2, X, Send } from "lucide-react"
import type { Event } from "@/types"

interface ActivityRecordsProps {
  composeOpen?: boolean
  onCloseCompose?: () => void
  limit?: number
  maxPages?: number
}

export function ActivityRecords({
  composeOpen = false,
  onCloseCompose,
  limit,
  maxPages,
}: ActivityRecordsProps) {
  const pathname = usePathname()
  const { events, mutate, loadMore, isLoadingMore, isReachingEnd, toggleRsvp } = useEvents(
    limit || maxPages ? { limit, maxPages } : {}
  )
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const portalTarget = typeof document === "undefined" ? null : document.body
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventTime: "",
  })

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" })
    mutate()
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.eventTime || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          eventTime: new Date(form.eventTime).toISOString(),
        }),
      })
      if (res.ok) {
        setForm({ title: "", description: "", location: "", eventTime: "" })
        onCloseCompose?.()
        mutate()
        toast.success("活动已发布")
      } else if (res.status === 401) {
        toast.error("请先登录")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "发布失败")
      }
    } catch {
      toast.error("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="events" className="relative px-4 py-12 md:py-16">
      <Doodle type="arrow" className="absolute right-[10%] top-20 hidden md:block" size={40} />
      <Doodle type="music" className="absolute bottom-20 left-[8%] hidden md:block" size={35} />

      <div className="mx-auto mb-8 max-w-3xl md:mb-10">
        <motion.div
          className="flex w-full items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Calendar className="text-amber-200/70" size={28} />
          <h2 className="font-brush text-3xl text-amber-100 md:text-4xl">
            活动报名
          </h2>
          {pathname !== "/events" && (
            <Link
              href="/events"
              className="ml-auto font-handwritten text-sm text-amber-400/80 transition-colors hover:text-amber-300"
            >
              查看全部 →
            </Link>
          )}
        </motion.div>
      </div>

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
                  className="relative w-full max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-lg"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-amber-100 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
                    <h3 className="font-brush text-2xl text-amber-800">创建活动</h3>
                    <button
                      onClick={onCloseCompose}
                      className="text-amber-400 transition-colors hover:text-amber-600"
                      aria-label="关闭"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="活动名称"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="rounded-lg border border-amber-200 px-4 py-2.5 font-handwritten text-amber-900 outline-none transition-colors placeholder:text-amber-400/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        maxLength={50}
                      />
                      <input
                        type="datetime-local"
                        value={form.eventTime}
                        onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                        className="rounded-lg border border-amber-200 px-4 py-2.5 font-handwritten text-amber-900 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="地点（可选）"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full rounded-lg border border-amber-200 px-4 py-2.5 font-handwritten text-amber-900 outline-none transition-colors placeholder:text-amber-400/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      maxLength={100}
                    />
                    <textarea
                      placeholder="活动描述（可选）"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="min-h-[96px] w-full resize-none rounded-lg border border-amber-200 px-4 py-2.5 font-handwritten text-amber-900 outline-none transition-colors placeholder:text-amber-400/60 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      maxLength={500}
                    />
                  </div>

                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
                    <button
                      onClick={handleSubmit}
                      disabled={!form.title.trim() || !form.eventTime || isSubmitting}
                      className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 font-handwritten text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Send size={15} />
                      {isSubmitting ? "发布中..." : "发布活动"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalTarget
        )}

      <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="relative cursor-pointer rounded-lg bg-paper-white/90 p-5 shadow-lg transition-shadow hover:shadow-xl md:p-6 torn-edge"
            style={{
              transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)`,
            }}
            initial={{ opacity: 0, y: 30, rotate: (index % 2 === 0 ? 1 : -1) * 1.5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <MaskingTape position="top-right" rotation={20} />

            <h3 className="mb-2 font-brush text-2xl text-amber-800">
              {event.title}
            </h3>

            <div className="mb-3 flex items-center gap-4 text-amber-600">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span className="font-handwritten">
                  {new Date(event.eventTime).toLocaleDateString("zh-CN")}
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
              <p className="mb-3 font-handwritten text-lg leading-relaxed text-amber-700">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-amber-500">
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span className="font-handwritten text-sm">
                  {event.commentCount} 条评论
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span className="font-handwritten text-sm">
                  {event.attendeeCount} 人参加
                </span>
              </div>
              {event.isAttending && (
                <span className="flex items-center gap-1 text-xs font-handwritten text-green-600">
                  <CheckCircle2 size={14} />
                  已报名
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="py-16 text-center">
          <Calendar className="mx-auto mb-4 text-amber-200/40" size={48} />
          <p className="text-xl font-handwritten text-amber-100/60">
            还没有活动报名
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-8 text-center">
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
              所有活动都在这里了
            </p>
          )}
        </div>
      )}

      {portalTarget &&
        createPortal(
          <EventDetailModal
            key={selectedEvent?.id ?? "event-detail"}
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={handleDeleteEvent}
            onRsvp={toggleRsvp}
            currentUserId={session?.user?.id}
          />,
          portalTarget
        )}
    </section>
  )
}
