"use client"

import { useEffect, useState } from "react"
import { Trash2, MessageCircle } from "lucide-react"

type Tab = "photo" | "message" | "event"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
  parent?: { id: string; caption?: string | null; url?: string; content?: string; title?: string }
}

interface CommentsData {
  photoComments: (Comment & { photo: { id: string; caption: string | null; url: string } })[]
  messageReplies: (Comment & { message: { id: string; content: string } })[]
  eventComments: (Comment & { event: { id: string; title: string } })[]
}

export default function AdminCommentsPage() {
  const [data, setData] = useState<CommentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("photo")

  useEffect(() => {
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  const deleteComment = async (type: Tab, id: string) => {
    if (!confirm("确认删除这条评论/回复？")) return
    await fetch(`/api/admin/comments/${type}/${id}`, { method: "DELETE" })
    setData((prev) => {
      if (!prev) return prev
      if (type === "photo") return { ...prev, photoComments: prev.photoComments.filter((c) => c.id !== id) }
      if (type === "message") return { ...prev, messageReplies: prev.messageReplies.filter((c) => c.id !== id) }
      return { ...prev, eventComments: prev.eventComments.filter((c) => c.id !== id) }
    })
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "photo", label: "照片评论", count: data?.photoComments.length ?? 0 },
    { key: "message", label: "留言回复", count: data?.messageReplies.length ?? 0 },
    { key: "event", label: "活动评论", count: data?.eventComments.length ?? 0 },
  ]

  const renderTable = (
    items: Comment[],
    parentLabel: (item: Comment) => string,
    type: Tab
  ) => (
    items.length === 0 ? (
      <div className="text-center py-16 text-gray-600">
        <MessageCircle size={36} className="mx-auto mb-3 opacity-40" />
        <p>暂无内容</p>
      </div>
    ) : (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">内容</th>
              <th className="text-left px-4 py-3">作者</th>
              <th className="text-left px-4 py-3">所属</th>
              <th className="text-left px-4 py-3">时间</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                <td className="px-4 py-3 text-gray-200 max-w-xs">
                  <p className="line-clamp-2">{item.content}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{item.user.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px]">
                  <p className="line-clamp-2">{parentLabel(item)}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteComment(type, item.id)}
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
    )
  )

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">回复管理</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded text-sm transition-colors ${
              tab === key
                ? "bg-amber-500/20 text-amber-300"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Force rebuild */}
      {loading || !data ? (
        <p className="text-gray-400">加载中...</p>
      ) : (
        <>
          {tab === "photo" && renderTable(
            data!.photoComments as Comment[],
            (item) => (item as (typeof data!.photoComments)[0]).photo.caption ?? "（无标题）",
            "photo"
          )}
          {tab === "message" && renderTable(
            data!.messageReplies as Comment[],
            (item) => (item as (typeof data!.messageReplies)[0]).message.content,
            "message"
          )}
          {tab === "event" && renderTable(
            data!.eventComments as Comment[],
            (item) => (item as (typeof data!.eventComments)[0]).event.title,
            "event"
          )}
        </>
      )}
    </div>
  )
}
