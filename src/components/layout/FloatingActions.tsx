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
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            <button
              onClick={() => {
                onUploadPhoto?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              <Camera size={18} />
              <span className="font-handwritten">上传照片</span>
            </button>
            <button
              onClick={() => {
                onWriteMessage?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors whitespace-nowrap"
            >
              <MessageSquare size={18} />
              <span className="font-handwritten">写留言</span>
            </button>
            <button
              onClick={() => {
                onCreateEvent?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              <CalendarPlus size={18} />
              <span className="font-handwritten">创建活动</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  )
}
