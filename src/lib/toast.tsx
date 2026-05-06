"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

type ToastType = "info" | "success" | "error"
interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const EVENT = "__app_toast__"
let counter = 0

export function toast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return
  const detail: ToastItem = { id: ++counter, message, type }
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail }))
}

toast.success = (m: string) => toast(m, "success")
toast.error = (m: string) => toast(m, "error")
toast.info = (m: string) => toast(m, "info")

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastItem>).detail
      setItems((prev) => [...prev, detail])
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== detail.id))
      }, 2500)
    }
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`px-4 py-2 rounded-lg shadow-lg font-handwritten text-sm pointer-events-auto ${
              t.type === "error"
                ? "bg-red-500 text-white"
                : t.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
