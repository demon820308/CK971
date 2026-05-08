"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Users } from "lucide-react"
import type { ClassInfo, User } from "@/types"

interface ClassMember extends Pick<User, "id" | "name" | "avatar" | "bio" | "role"> {
  joinedAt: string
}

interface ClassInfoModalProps {
  isOpen: boolean
  onClose: () => void
  classInfo: ClassInfo | null
}

export function ClassInfoModal({ isOpen, onClose, classInfo }: ClassInfoModalProps) {
  const [members, setMembers] = useState<ClassMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    fetch("/api/classes/members")
      .then((res) => res.json())
      .then((data) => setMembers(data.items ?? []))
      .finally(() => setIsLoading(false))
  }, [isOpen])

  const handleCopy = async () => {
    if (!classInfo?.inviteCode) return
    try {
      await navigator.clipboard.writeText(classInfo.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore clipboard failures
    }
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && classInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-3 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl bg-paper-white shadow-xl sm:max-w-md md:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-200 p-3 md:p-4">
              <h2 className="font-brush text-xl text-amber-800 md:text-2xl">班级信息</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 border-b border-amber-100 p-3 md:p-4">
              <p className="font-brush text-lg text-amber-900 md:text-xl">
                {classInfo.gradeYear ? `${classInfo.gradeYear}级` : ""}
                {classInfo.name ? ` ${classInfo.name}` : ""}
              </p>
              {classInfo.schoolName && (
                <p className="font-handwritten text-amber-700">{classInfo.schoolName}</p>
              )}
              {classInfo.description && (
                <p className="font-handwritten text-sm text-amber-700">
                  {classInfo.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                <span className="text-xs text-amber-600">邀请码</span>
                <code className="flex-1 select-all font-mono text-sm text-amber-900">
                  {classInfo.inviteCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="rounded p-1.5 text-amber-700 transition-colors hover:bg-amber-100"
                  title="复制邀请码"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Users size={18} />
                <span className="font-medium">成员 ({members.length})</span>
              </div>
              {isLoading && <p className="py-4 text-center text-gray-400">加载中...</p>}
              {!isLoading && members.length === 0 && (
                <p className="py-4 text-center font-handwritten text-gray-400">
                  还没有成员
                </p>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-lg bg-white/70 p-2"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-800">
                      {member.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-amber-900">{member.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
