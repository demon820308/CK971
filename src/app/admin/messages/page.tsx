"use client"

import { useEffect, useState } from "react"
import { Trash2, MessageSquare } from "lucide-react"

interface Message {
  id: string
  content: string
  color: string
  createdAt: string
  author: { id: string; name: string }
  _count: { likes: number; replies: number }
}

const colorMap: Record<string, string> = {
  YELLOW: "bg-yellow-100",
  PINK: "bg-pink-100",
  BLUE: "bg-blue-100",
  GREEN: "bg-green-100",
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((data) => { setMessages(data); setLoading(false) })
  }, [])

  const deleteMessage = async (id: string) => {
    if (!confirm("确认删除这条留言？")) return
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" })
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">留言管理</h1>
      <p className="text-gray-400 text-sm mb-6">共 {messages.length} 条</p>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p>暂无留言</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3 w-12">颜色</th>
                <th className="text-left px-4 py-3">内容</th>
                <th className="text-left px-4 py-3">作者</th>
                <th className="text-center px-4 py-3">互动</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <div className={`w-5 h-5 rounded ${colorMap[msg.color] ?? "bg-gray-300"}`} />
                  </td>
                  <td className="px-4 py-3 text-gray-200 max-w-xs">
                    <p className="line-clamp-2">{msg.content}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{msg.author.name}</td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    ♥ {msg._count.likes} · 💬 {msg._count.replies}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMessage(msg.id)}
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
