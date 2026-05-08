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

  const renderItems = () =>
    photos.map((photo, index) => {
      const col = index % 3
      const offsetClass = col === 1 ? "md:mt-[30px]" : col === 2 ? "md:mt-[-15px]" : ""

      return (
        <motion.div
          key={`photo-${photo.id}`}
          className={offsetClass}
          style={{ marginTop: 0, position: "relative", zIndex: (index % 2) + 1 }}
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
    <section id="photos" className="relative px-4 py-10 md:py-8">
      <Doodle type="camera" className="absolute left-[5%] top-10 hidden md:block" size={45} />
      <Doodle type="star" className="absolute right-[8%] top-32 hidden md:block" size={35} />

      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-6 flex items-center gap-2 md:mb-8"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Camera className="text-amber-200/70" size={20} />
          <h2 className="font-brush text-xl text-amber-100 md:text-3xl">班级瞬间回忆</h2>
          <span className="font-handwritten text-base text-amber-300 md:text-lg">→</span>
          {pathname !== "/photos" && (
            <Link
              href="/photos"
              className="ml-auto text-xs font-handwritten text-amber-400/80 transition-colors hover:text-amber-300 md:text-sm"
            >
              查看全部 →
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-6 overflow-visible md:grid-cols-2 lg:grid-cols-3">
          {renderItems()}
        </div>
      </div>

      <div ref={sentinelRef} className="py-8 text-center">
        {isLoadingMore && (
          <p className="font-handwritten text-lg text-amber-200/60">加载更多回忆...</p>
        )}
        {isReachingEnd && photos.length > 0 && (
          <p className="font-handwritten text-lg text-amber-200/60">
            所有回忆都在这里了
          </p>
        )}
        {photos.length === 0 && !isLoadingMore && (
          <div className="py-16 text-center">
            <Camera className="mx-auto mb-4 text-amber-200/40" size={48} />
            <p className="font-handwritten text-xl text-amber-100/60">
              还没有照片，上传第一张吧
            </p>
          </div>
        )}
      </div>

      {portalTarget &&
        createPortal(
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
