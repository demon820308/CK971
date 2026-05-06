"use client"

import { useEffect, useState } from "react"
import { Users, Image, MessageSquare, Calendar } from "lucide-react"
import Link from "next/link"

interface Stats {
  users: number
  photos: number
  messages: number
  events: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/photos").then((r) => r.json()),
      fetch("/api/admin/messages").then((r) => r.json()),
      fetch("/api/admin/events").then((r) => r.json()),
    ]).then(([users, photos, messages, events]) => {
      setStats({
        users: Array.isArray(users) ? users.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        messages: Array.isArray(messages) ? messages.length : 0,
        events: Array.isArray(events) ? events.length : 0,
      })
    })
  }, [])

  const cards = [
    { label: "班级成员", value: stats?.users, icon: Users, href: "/admin/users", color: "text-blue-400" },
    { label: "照片", value: stats?.photos, icon: Image, href: "/admin/photos", color: "text-green-400" },
    { label: "留言", value: stats?.messages, icon: MessageSquare, href: "/admin/messages", color: "text-amber-400" },
    { label: "活动", value: stats?.events, icon: Calendar, href: "/admin/events", color: "text-purple-400" },
  ]

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-2">控制台</h1>
      <p className="text-gray-400 text-sm mb-8">概览班级数据</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
          >
            <Icon size={24} className={`${color} mb-3`} />
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-white text-3xl font-bold mt-1">
              {value ?? "—"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
