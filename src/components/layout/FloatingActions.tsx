"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Camera, MessageSquare, CalendarPlus, X } from "lucide-react"

interface FloatingActionsProps {
  onUploadPhoto?: () => void
  onWriteMessage?: () => void
  onCreateEvent?: () => void
}

export function FloatingActions({
  onUploadPhoto,
  onWriteMessage,
  onCreateEvent,
}: FloatingActionsProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) return null

  return (
    <div className="fixed bottom-4 right-3 z-50 md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-14 right-0 space-y-2 md:bottom-16 md:space-y-3"
          >
            <button
              onClick={() => {
                onUploadPhoto?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-amber-500 px-3 py-2 text-sm text-white shadow-lg transition-colors hover:bg-amber-600 md:px-4 md:py-2"
            >
              <Camera size={18} />
              <span className="font-handwritten">上传照片</span>
            </button>
            <button
              onClick={() => {
                onWriteMessage?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-pink-500 px-3 py-2 text-sm text-white shadow-lg transition-colors hover:bg-pink-600 md:px-4 md:py-2"
            >
              <MessageSquare size={18} />
              <span className="font-handwritten">写留言</span>
            </button>
            <button
              onClick={() => {
                onCreateEvent?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-2 text-sm text-white shadow-lg transition-colors hover:bg-emerald-700 md:px-4 md:py-2"
            >
              <CalendarPlus size={18} />
              <span className="font-handwritten">创建活动</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-colors hover:bg-amber-600 md:h-14 md:w-14"
      >
        {isOpen ? <X size={22} /> : <Plus size={22} />}
      </button>
    </div>
  )
}
