"use client"

import { motion } from "framer-motion"
import { Heart, MessageCircle } from "lucide-react"
import type { StickyColor } from "@/types"

interface StickyNoteProps {
  content: string
  color: StickyColor
  rotation: number
  author?: { name: string; avatar?: string | null }
  likeCount?: number
  replyCount?: number
  isLiked?: boolean
  onLike?: () => void
  onReply?: () => void
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

const colorMap: Record<StickyColor, string> = {
  YELLOW: "bg-sticky-yellow",
  PINK: "bg-sticky-pink",
  BLUE: "bg-sticky-blue",
  GREEN: "bg-sticky-green",
}

export function StickyNote({
  content,
  color,
  rotation,
  author,
  likeCount = 0,
  replyCount = 0,
  isLiked = false,
  onLike,
  onReply,
  onClick,
  className = "",
  style,
}: StickyNoteProps) {
  return (
    <motion.div
      className={`relative p-4 md:p-5 ${colorMap[color]} sticky-fold shadow-[var(--shadow-sticky)] ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onClick}
    >
      <p className="mb-3 font-handwritten text-lg leading-relaxed text-amber-900 md:text-xl">
        {content}
      </p>

      {author && (
        <p className="mb-2 font-handwritten text-sm text-amber-700">
          鈥斺€?{author.name}
        </p>
      )}

      <div className="mt-2 flex items-center gap-3">
        {onLike && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLike?.()
            }}
            className="flex items-center gap-1 text-sm text-amber-700 transition-colors hover:text-red-500"
          >
            <Heart
              size={16}
              className={isLiked ? "fill-red-500 text-red-500" : ""}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        )}
        {onReply && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReply?.()
            }}
            className="flex items-center gap-1 text-sm text-amber-700 transition-colors hover:text-amber-900"
          >
            <MessageCircle size={16} />
            {replyCount > 0 && <span>{replyCount}</span>}
          </button>
        )}
      </div>
    </motion.div>
  )
}
