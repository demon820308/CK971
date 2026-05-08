"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"

interface PolaroidPhotoProps {
  url: string
  caption?: string | null
  rotation: number
  cropX: number
  cropY: number
  likeCount: number
  commentCount: number
  isLiked: boolean
  onLike?: () => void
  onComment?: () => void
  onClick?: () => void
}

export function PolaroidPhoto({
  url,
  caption,
  rotation,
  cropX,
  cropY,
  likeCount,
  commentCount,
  isLiked,
  onLike,
  onComment,
  onClick,
}: PolaroidPhotoProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="relative mb-6 cursor-pointer break-inside-avoid"
      style={{ transform: `rotate(${rotation}deg)` }}
      whileHover={{ scale: 1.03, zIndex: 50 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="tape-strip -top-3 left-1/2 -translate-x-1/2" />

      <div className="bg-white p-2 pb-10 shadow-[var(--shadow-polaroid)] md:p-3 md:pb-12">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={url}
            alt={caption || "照片"}
            fill
            className="vintage-filter object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectPosition: `${cropX}% ${cropY}%` }}
          />
        </div>

        <p className="absolute bottom-2 left-2 right-2 truncate text-center font-handwritten text-sm text-amber-800 md:bottom-3 md:left-3 md:right-3 md:text-lg">
          {caption || " "}
        </p>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-end justify-center gap-4 bg-black/20 pb-10 md:pb-14"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike?.()
            }}
            className="flex items-center gap-1 text-sm text-white"
          >
            <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
            <span>{likeCount}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onComment?.()
            }}
            className="flex items-center gap-1 text-sm text-white"
          >
            <MessageCircle size={18} />
            <span>{commentCount}</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
