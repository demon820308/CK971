"use client"

import { useEffect, useState } from "react"
import { Save, Settings, Pencil, X } from "lucide-react"

interface ClassSettings {
  id: string
  name: string
  schoolName: string | null
  gradeYear: number | null
  endYear: number | null
  description: string | null
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<ClassSettings | null>(null)
  const [form, setForm] = useState<ClassSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setData(d); setForm(d); setLoading(false) })
  }, [])

  const startEdit = () => {
    setForm(data ? { ...data } : null)
    setError("")
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm(data ? { ...data } : null)
    setError("")
    setEditing(false)
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    setError("")

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        schoolName: form.schoolName,
        gradeYear: form.gradeYear?.toString() ?? "",
        endYear: form.endYear?.toString() ?? "",
        description: form.description,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      setData(updated)
      setForm(updated)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? "保存失败")
    }
    setSaving(false)
  }

  if (loading || !data || !form) return <div className="p-8 text-gray-400">加载中...</div>

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-amber-400" />
          <h1 className="text-white text-2xl font-bold">基本信息</h1>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
          >
            <Pencil size={14} />
            修改
          </button>
        )}
      </div>

      {saved && (
        <div className="mb-4 px-4 py-2.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-sm">
          已保存成功 ✓
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* 班级名称 */}
        <div>
          <p className="text-gray-500 text-xs mb-1">班级名称</p>
          {editing ? (
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
            />
          ) : (
            <p className="text-white text-base">{data.name || "—"}</p>
          )}
        </div>

        {/* 学校名称 */}
        <div>
          <p className="text-gray-500 text-xs mb-1">学校名称</p>
          {editing ? (
            <input
              value={form.schoolName ?? ""}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value || null })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
            />
          ) : (
            <p className="text-white text-base">{data.schoolName || "—"}</p>
          )}
        </div>

        {/* 在校期间 */}
        <div>
          <p className="text-gray-500 text-xs mb-1">在校期间</p>
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={form.gradeYear ?? ""}
                onChange={(e) => setForm({ ...form, gradeYear: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="开始年份（如 1997）"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
              <input
                type="number"
                value={form.endYear ?? ""}
                onChange={(e) => setForm({ ...form, endYear: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="结束年份（如 2000）"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            <p className="text-white text-base">
              {data.gradeYear && data.endYear
                ? `${data.gradeYear} - ${data.endYear}`
                : data.gradeYear ?? data.endYear ?? "—"}
            </p>
          )}
        </div>

        {/* 班级简介 */}
        <div>
          <p className="text-gray-500 text-xs mb-1">班级简介</p>
          {editing ? (
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          ) : (
            <p className="text-white text-base whitespace-pre-line">{data.description || "—"}</p>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {editing && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <Save size={15} />
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              <X size={15} />
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
