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

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" })
    mutate()
  }
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventTime: "",
  })

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
    <section id="events" className="relative py-16 px-4">
      <Doodle type="arrow" className="absolute top-20 right-[10%]" size={40} />
      <Doodle type="music" className="absolute bottom-20 left-[8%]" size={35} />

      <div className="max-w-3xl mx-auto flex items-center mb-10">
        <motion.div
          className="flex w-full items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Calendar className="text-amber-200/70" size={28} />
          <h2 className="font-brush text-3xl md:text-4xl text-amber-100">
            活动报名
          </h2>
          {pathname !== "/events" && (
            <Link
              href="/events"
              className="ml-auto font-handwritten text-sm text-amber-400/80 hover:text-amber-300 transition-colors"
            >
              查看全部 →
            </Link>
          )}
        </motion.div>
      </div>

      {/* Event creation modal via portal */}
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
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-amber-100">
                  <h3 className="font-brush text-2xl text-amber-800">
                    创建活动
                  </h3>
                  <button
                    onClick={onCloseCompose}
                    className="text-amber-400 hover:text-amber-600 transition-colors"
                    aria-label="关闭"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form body */}
                <div className="px-6 py-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="活动名称"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="px-4 py-2.5 rounded-lg font-handwritten text-amber-900 placeholder:text-amber-400/60 outline-none border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                      maxLength={50}
                    />
                    <input
                      type="datetime-local"
                      value={form.eventTime}
                      onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                      className="px-4 py-2.5 rounded-lg font-handwritten text-amber-900 outline-none border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="地点（可选）"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg font-handwritten text-amber-900 placeholder:text-amber-400/60 outline-none border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors"
                    maxLength={100}
                  />
                  <textarea
                    placeholder="活动描述（可选）"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg font-handwritten text-amber-900 placeholder:text-amber-400/60 outline-none border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none min-h-[80px] transition-colors"
                    maxLength={500}
                  />
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                  <button
                    onClick={handleSubmit}
                    disabled={!form.title.trim() || !form.eventTime || isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-handwritten transition-colors disabled:opacity-50"
                  >
                    <Send size={15} />
                    {isSubmitting ? "提交中..." : "发布活动"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget
      )}

      <div className="max-w-3xl mx-auto space-y-8">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="relative bg-paper-white/90 p-6 rounded-lg shadow-lg torn-edge cursor-pointer hover:shadow-xl transition-shadow"
            style={{
              transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)`,
            }}
            initial={{ opacity: 0, y: 30, rotate: (index % 2 === 0 ? 1 : -1) * 1.5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <MaskingTape position="top-right" rotation={20} />

            <h3 className="font-brush text-2xl text-amber-800 mb-2">
              {event.title}
            </h3>

            <div className="flex items-center gap-4 text-amber-600 mb-3">
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
              <p className="font-handwritten text-lg text-amber-700 leading-relaxed mb-3">
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
                <span className="flex items-center gap-1 text-green-600 text-xs font-handwritten">
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
          <Calendar className="mx-auto text-amber-200/40 mb-4" size={48} />
          <p className="font-handwritten text-amber-100/60 text-xl">
            还没有活动报名
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="text-center mt-8">
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
              所有活动都在这里了
            </p>
          )}
        </div>
      )}

      {portalTarget && createPortal(
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
