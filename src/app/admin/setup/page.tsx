"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"

export default function AdminSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ email: "", name: "", password: "", confirm: "" })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then(({ exists }) => {
        if (exists) router.replace("/")
        else setChecking(false)
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (form.password !== form.confirm) { setError("两次密码不一致"); return }
    setSubmitting(true)
    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    router.replace("/login")
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-amber-400" size={32} />
          <div>
            <h1 className="text-white text-xl font-bold">创建超级管理员</h1>
            <p className="text-gray-400 text-sm">首次设置，完成后此页面将关闭</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">邮箱</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">姓名</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">密码（至少8位）</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">确认密码</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "创建中..." : "创建超级管理员"}
          </button>
        </form>
      </div>
    </div>
  )
}
