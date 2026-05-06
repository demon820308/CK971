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
      className={`relative p-5 ${colorMap[color]} shadow-[var(--shadow-sticky)] sticky-fold ${onClick ? "cursor-pointer" : ""} ${className}`}
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
      <p className="font-handwritten text-xl text-amber-900 leading-relaxed mb-3">
        {content}
      </p>

      {author && (
        <p className="font-handwritten text-sm text-amber-700 mb-2">
          —— {author.name}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        {onLike && (
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.() }}
            className="flex items-center gap-1 text-amber-700 text-sm hover:text-red-500 transition-colors"
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
            onClick={(e) => { e.stopPropagation(); onReply?.() }}
            className="flex items-center gap-1 text-amber-700 text-sm hover:text-amber-900 transition-colors"
          >
            <MessageCircle size={16} />
            {replyCount > 0 && <span>{replyCount}</span>}
          </button>
        )}
      </div>
    </motion.div>
  )
}
