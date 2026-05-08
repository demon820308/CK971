"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { PolaroidPhoto, Doodle } from "@/components/scrapbook"
import { PhotoCommentModal } from "@/components/interactive/PhotoCommentModal"
import { usePhotos } from "@/hooks/usePhotos"
import Link from "next/link"
import { Camera } from "lucide-react"
import type { Photo } from "@/types"

interface PhotoMemoriesProps {
  limit?: number
  topLiked?: number
  maxPages?: number
}

export function PhotoMemories({ limit, topLiked, maxPages }: PhotoMemoriesProps = {}) {
  const { photos, isLoadingMore, isReachingEnd, setSize, toggleLike, addComment, mutate } = usePhotos(
    limit || topLiked || maxPages ? { limit, topLiked, maxPages } : {}
  )
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleDeletePhoto = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: "DELETE" })
    mutate()
  }
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const portalTarget = typeof document === "undefined" ? null : document.body

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
        setSize((prev) => prev + 1)
      }
    },
    [isLoadingMore, isReachingEnd, setSize]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    })
    observer.observe(sentinel)

    return () => {
      observer.unobserve(sentinel)
    }
  }, [handleIntersect])

  // Per-column offsets for organic scatter (column = index % 3)
  const colOffsets = [0, 30, -15]

  const renderItems = () =>
    photos.map((photo, index) => {
      const col = index % 3
      const offsetY = colOffsets[col]
      return (
        <motion.div
          key={`photo-${photo.id}`}
          style={{ marginTop: `${offsetY}px`, position: "relative", zIndex: (index % 2) + 1 }}
          initial={{ opacity: 0, y: 30, rotate: photo.rotation }}
          whileInView={{ opacity: 1, y: 0, rotate: photo.rotation }}
          viewport={{ once: true }}
          transition={{ delay: col * 0.1, duration: 0.5, type: "spring", stiffness: 90 }}
        >
          <PolaroidPhoto
            url={photo.url}
            caption={photo.caption}
            rotation={photo.rotation}
            cropX={photo.cropX}
            cropY={photo.cropY}
            likeCount={photo.likeCount}
            commentCount={photo.commentCount}
            isLiked={photo.isLiked}
            onLike={() => toggleLike(photo.id)}
            onComment={() => setSelectedPhoto(photo)}
            onClick={() => setSelectedPhoto(photo)}
          />
        </motion.div>
      )
    })

  return (
    <section id="photos" className="relative py-8 px-4">
      <Doodle type="camera" className="absolute top-10 left-[5%]" size={45} />
      <Doodle type="star" className="absolute top-32 right-[8%]" size={35} />

      <div className="max-w-5xl mx-auto">
        {/* Section label in hand-drawn style */}
        <motion.div
          className="flex items-center gap-2 mb-8"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Camera className="text-amber-200/70" size={24} />
          <h2 className="font-brush text-2xl md:text-3xl text-amber-100">
            班级瞬间回忆
          </h2>
          <span className="font-handwritten text-amber-300 text-lg">→</span>
          {pathname !== "/photos" && (
            <Link
              href="/photos"
              className="ml-auto font-handwritten text-sm text-amber-400/80 hover:text-amber-300 transition-colors"
            >
              查看全部 →
            </Link>
          )}
        </motion.div>

        {/* Scrapbook grid — row-first so top-liked photos appear in the first visual rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6" style={{ overflow: "visible" }}>
          {renderItems()}
        </div>
      </div>

      {/* Loading / End indicator */}
      <div ref={sentinelRef} className="py-8 text-center">
        {isLoadingMore && (
          <p className="font-handwritten text-amber-200/60 text-lg">
            加载更多回忆...
          </p>
        )}
        {isReachingEnd && photos.length > 0 && (
          <p className="font-handwritten text-amber-200/60 text-lg">
            所有回忆都在这里了 ✨
          </p>
        )}
        {photos.length === 0 && !isLoadingMore && (
          <div className="py-16 text-center">
            <Camera className="mx-auto text-amber-200/40 mb-4" size={48} />
            <p className="font-handwritten text-amber-100/60 text-xl">
              还没有照片，上传第一张吧
            </p>
          </div>
        )}
      </div>

      {portalTarget && createPortal(
        <PhotoCommentModal
          key={selectedPhoto?.id ?? "photo-detail"}
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onComment={addComment}
          onLike={toggleLike}
          onDelete={handleDeletePhoto}
          currentUserId={session?.user?.id}
        />,
        portalTarget
      )}
    </section>
  )
}
