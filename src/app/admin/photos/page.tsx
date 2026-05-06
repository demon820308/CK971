"use client"

import { useEffect, useState } from "react"
import { Trash2, Image as ImageIcon } from "lucide-react"

interface Photo {
  id: string
  url: string
  caption: string | null
  uploadedAt: string
  uploader: { id: string; name: string }
  _count: { likes: number; comments: number }
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/photos")
      .then((r) => r.json())
      .then((data) => { setPhotos(data); setLoading(false) })
  }, [])

  const deletePhoto = async (id: string) => {
    if (!confirm("确认删除这张照片？")) return
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" })
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-6">图片管理</h1>
      <p className="text-gray-400 text-sm mb-6">共 {photos.length} 张</p>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p>暂无照片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
            >
              <img src={photo.url} alt={photo.caption ?? ""} className="w-full aspect-square object-cover" />
              <div className="p-2">
                <p className="text-gray-300 text-xs truncate">{photo.caption || "无描述"}</p>
                <p className="text-gray-500 text-xs mt-0.5">{photo.uploader.name}</p>
                <p className="text-gray-600 text-xs">♥ {photo._count.likes} · 💬 {photo._count.comments}</p>
              </div>
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
