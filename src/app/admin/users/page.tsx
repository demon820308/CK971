"use client"

import { useEffect, useState } from "react"
import { Trash2, Ban, CheckCircle, KeyRound, Search } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: string
  banned: boolean
  createdAt: string
  _count: { photos: number; messages: number; events: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [resetModal, setResetModal] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [resetError, setResetError] = useState("")

  const load = () =>
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false) })

  useEffect(() => { load() }, [])

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`确认删除用户「${name}」？此操作不可撤销。`)) return
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const toggleBan = async (id: string, banned: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banned }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, banned: !banned } : u))
    }
  }

  const resetPassword = async () => {
    if (!resetModal) return
    setResetError("")
    const res = await fetch(`/api/admin/users/${resetModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    })
    const data = await res.json()
    if (!res.ok) { setResetError(data.error); return }
    setResetModal(null)
    setNewPassword("")
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">账号管理</h1>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名或邮箱..."
          className="w-full max-w-sm bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3">用户</th>
                <th className="text-left px-4 py-3">邮箱</th>
                <th className="text-center px-4 py-3">内容</th>
                <th className="text-center px-4 py-3">状态</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold">
                          {user.name[0]}
                        </div>
                      )}
                      <span className="text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {user._count.photos}图 · {user._count.messages}言 · {user._count.events}活
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.banned ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">已禁用</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleBan(user.id, user.banned)}
                        title={user.banned ? "启用" : "禁用"}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${user.banned ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {user.banned ? <CheckCircle size={15} /> : <Ban size={15} />}
                      </button>
                      <button
                        onClick={() => { setResetModal({ id: user.id, name: user.name }); setNewPassword("") }}
                        title="重置密码"
                        className="p-1.5 rounded hover:bg-gray-700 text-blue-400 transition-colors"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        title="删除"
                        className="p-1.5 rounded hover:bg-gray-700 text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">暂无用户</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset password modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-1">重置密码</h2>
            <p className="text-gray-400 text-sm mb-4">为「{resetModal.name}」设置新密码</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少8位）"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:border-amber-400"
            />
            {resetError && <p className="text-red-400 text-sm mb-3">{resetError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setResetModal(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={resetPassword}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
