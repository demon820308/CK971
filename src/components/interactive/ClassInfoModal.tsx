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
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
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
      // ignore
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
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-paper-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-amber-200">
              <h2 className="font-brush text-2xl text-amber-800">班级信息</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-amber-100 space-y-2">
              <p className="font-brush text-xl text-amber-900">
                {classInfo.gradeYear && `${classInfo.gradeYear}级`}
                {classInfo.name && ` ${classInfo.name}`}
              </p>
              {classInfo.schoolName && (
                <p className="font-handwritten text-amber-700">
                  {classInfo.schoolName}
                </p>
              )}
              {classInfo.description && (
                <p className="font-handwritten text-amber-700 text-sm">
                  {classInfo.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg p-3">
                <span className="text-xs text-amber-600">邀请码</span>
                <code className="flex-1 font-mono text-sm text-amber-900 select-all">
                  {classInfo.inviteCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                  title="复制邀请码"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <Users size={18} />
                <span className="font-medium">成员 ({members.length})</span>
              </div>
              {isLoading && (
                <p className="text-center text-gray-400 py-4">加载中...</p>
              )}
              {!isLoading && members.length === 0 && (
                <p className="text-center text-gray-400 py-4 font-handwritten">
                  还没有成员
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 bg-white/70 rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-amber-900 truncate">{m.name}</p>
                      {m.role === "ADMIN" && (
                        <p className="text-[10px] text-amber-500">管理员</p>
                      )}
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
