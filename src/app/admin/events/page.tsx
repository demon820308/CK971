"use client"

import { useEffect, useState } from "react"
import { Trash2, Calendar } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  eventTime: string | null
  createdAt: string
  creator: { id: string; name: string }
  _count: { comments: number; attendees: number }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false) })
  }, [])

  const deleteEvent = async (id: string, title: string) => {
    if (!confirm(`确认删除活动「${title}」？`)) return
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">活动管理</h1>
      <p className="text-gray-400 text-sm mb-6">共 {events.length} 个活动</p>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p>暂无活动</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">活动名称</th>
                <th className="text-left px-4 py-3">发起人</th>
                <th className="text-left px-4 py-3">地点</th>
                <th className="text-left px-4 py-3">活动时间</th>
                <th className="text-center px-4 py-3">参与</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{event.title}</p>
                    {event.description && (
                      <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{event.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{event.creator.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{event.location ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {event.eventTime
                      ? new Date(event.eventTime).toLocaleDateString("zh-CN")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    👥 {event._count.attendees} · 💬 {event._count.comments}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="p-1.5 rounded hover:bg-gray-700 text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
