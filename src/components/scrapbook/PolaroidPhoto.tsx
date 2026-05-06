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
      className="relative cursor-pointer break-inside-avoid mb-6"
      style={{ transform: `rotate(${rotation}deg)` }}
      whileHover={{ scale: 1.03, zIndex: 50 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Tape decoration */}
      <div className="tape-strip -top-3 left-1/2 -translate-x-1/2" />

      {/* Polaroid frame */}
      <div className="bg-white p-3 pb-12 shadow-[var(--shadow-polaroid)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={url}
            alt={caption || "照片"}
            fill
            className="object-cover vintage-filter"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectPosition: `${cropX}% ${cropY}%` }}
          />
        </div>

        {/* Caption */}
        <p className="absolute bottom-3 left-3 right-3 text-center font-handwritten text-lg text-amber-800 truncate">
          {caption || " "}
        </p>
      </div>

      {/* Hover overlay with actions */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/20 flex items-end justify-center pb-14 gap-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike?.()
            }}
            className="flex items-center gap-1 text-white text-sm"
          >
            <Heart
              size={20}
              className={isLiked ? "fill-red-500 text-red-500" : ""}
            />
            <span>{likeCount}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onComment?.()
            }}
            className="flex items-center gap-1 text-white text-sm"
          >
            <MessageCircle size={20} />
            <span>{commentCount}</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
