"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Image as ImageIcon, Move } from "lucide-react"

type Step = "select" | "position" | "caption"

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RATIO = 4 / 3

function compressImage(file: File, maxW = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxW) {
        h = Math.round(h * (maxW / w))
        w = maxW
      }

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("canvas error"))
        return
      }

      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error("toBlob failed"))
      }, "image/jpeg", quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("load error"))
    }

    img.src = url
  })
}

export function PhotoUploadModal({ isOpen, onClose, onSuccess }: PhotoUploadModalProps) {
  const [step, setStep] = useState<Step>("select")
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [posX, setPosX] = useState(50)
  const [posY, setPosY] = useState(50)
  const [natSize, setNatSize] = useState({ w: 0, h: 0 })
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  const isDragging = useRef(false)
  const lastDrag = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep("select")
    setOriginalFile(null)
    setPreview(null)
    setPosX(50)
    setPosY(50)
    setNatSize({ w: 0, h: 0 })
    setCroppedPreview(null)
    setCaption("")
    setError("")
    setIsDragOver(false)
    isDragging.current = false
  }, [])

  useEffect(() => {
    if (isOpen) return
    const timer = window.setTimeout(reset, 300)
    return () => window.clearTimeout(timer)
  }, [isOpen, reset])

  useEffect(() => {
    if (step !== "position" || !preview) return
    const img = new Image()
    img.onload = () => setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = preview
  }, [step, preview])

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("请选择图片文件")
      return
    }
    if (selectedFile.size > 8 * 1024 * 1024) {
      setError("文件大小不能超过 8MB")
      return
    }

    setOriginalFile(selectedFile)
    setError("")

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
      setPosX(50)
      setPosY(50)
      setStep("position")
    }
    reader.readAsDataURL(selectedFile)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const applyDelta = (dx: number, dy: number) => {
    if (natSize.w === 0) return
    const container = containerRef.current
    if (!container) return

    const cW = container.offsetWidth
    const cH = cW / RATIO
    const scale = Math.max(cW / natSize.w, cH / natSize.h)
    const overflowX = natSize.w * scale - cW
    const overflowY = natSize.h * scale - cH

    if (overflowX > 1) setPosX((p) => Math.min(100, Math.max(0, p - (dx / overflowX) * 100)))
    if (overflowY > 1) setPosY((p) => Math.min(100, Math.max(0, p - (dy / overflowY) * 100)))
  }

  const onMouseDown = (event: React.MouseEvent) => {
    isDragging.current = true
    lastDrag.current = { x: event.clientX, y: event.clientY }
    event.preventDefault()
  }

  const onMouseMove = (event: React.MouseEvent) => {
    if (!isDragging.current) return
    applyDelta(event.clientX - lastDrag.current.x, event.clientY - lastDrag.current.y)
    lastDrag.current = { x: event.clientX, y: event.clientY }
  }

  const onMouseUp = () => {
    isDragging.current = false
  }

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    isDragging.current = true
    lastDrag.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchMove = (event: React.TouchEvent) => {
    if (!isDragging.current) return
    const touch = event.touches[0]
    applyDelta(touch.clientX - lastDrag.current.x, touch.clientY - lastDrag.current.y)
    lastDrag.current = { x: touch.clientX, y: touch.clientY }
    event.preventDefault()
  }

  const onTouchEnd = () => {
    isDragging.current = false
  }

  const confirmPosition = () => {
    setCroppedPreview(preview)
    setStep("caption")
  }

  const skipPosition = () => {
    setPosX(50)
    setPosY(50)
    setCroppedPreview(preview)
    setStep("caption")
  }

  const handleSubmit = async () => {
    if (!originalFile || isUploading) return

    setIsUploading(true)
    setError("")

    try {
      const compressedBlob = await compressImage(originalFile)
      const formData = new FormData()
      formData.append("file", new File([compressedBlob], originalFile.name, { type: "image/jpeg" }))
      if (caption.trim()) formData.append("caption", caption.trim())
      formData.append("cropX", String(posX))
      formData.append("cropY", String(posY))

      const res = await fetch("/api/photos", { method: "POST", body: formData })
      let errMsg = "上传失败"
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await res.json()
          errMsg = data.error || errMsg
        } else {
          const text = await res.text()
          errMsg = text || errMsg
        }
        throw new Error(errMsg)
      }

      onSuccess?.()
      onClose()
      window.location.reload()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  const stepLabel =
    step === "select" ? "上传照片" : step === "position" ? "调整缩略图显示" : "添加说明"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-amber-100">
              <div className="flex items-center gap-2">
                {step === "position" && <Move size={18} className="text-amber-600" />}
                <h2 className="font-brush text-2xl text-amber-800">{stepLabel}</h2>
              </div>
              <button
                onClick={() => {
                  reset()
                  onClose()
                }}
                className="text-amber-400 hover:text-amber-600 transition-colors"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

              {step === "select" && (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragOver ? "border-amber-400 bg-amber-50" : "border-amber-200 hover:border-amber-400"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto mb-3 text-amber-500" size={38} />
                  <p className="font-handwritten text-amber-700 text-lg mb-1">点击或拖拽上传</p>
                  <p className="text-sm text-amber-500/70">支持 JPG、PNG、WebP，最大 8MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) handleFile(file)
                    }}
                  />
                </div>
              )}

              {step === "position" && preview && (
                <div>
                  <p className="text-sm text-amber-600 mb-2 flex items-center gap-1.5">
                    <Move size={14} /> 拖动图片，选择要显示的区域
                  </p>
                  <div
                    ref={containerRef}
                    className="relative w-full overflow-hidden rounded-xl bg-gray-200 cursor-grab active:cursor-grabbing select-none"
                    style={{ aspectRatio: "4/3" }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <img
                      src={preview}
                      alt="调整缩略图显示"
                      draggable={false}
                      className="w-full h-full"
                      style={{
                        objectFit: "cover",
                        objectPosition: `${posX}% ${posY}%`,
                        pointerEvents: "none",
                        display: "block",
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-amber-400/60 rounded-xl pointer-events-none" />
                  </div>
                </div>
              )}

              {step === "caption" && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={croppedPreview ?? ""}
                      alt="照片预览"
                      className="w-full object-cover aspect-[4/3]"
                    />
                    <button
                      onClick={() => setStep("position")}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      title="重新调整"
                    >
                      <Move size={15} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">写点说明</label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="给这张照片写个说明"
                      className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 font-handwritten text-amber-900"
                      maxLength={100}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  reset()
                  onClose()
                }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <div className="flex gap-2">
                {step === "position" && (
                  <>
                    <button
                      onClick={skipPosition}
                      className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm"
                    >
                      跳过
                    </button>
                    <button
                      onClick={confirmPosition}
                      className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    >
                      <Move size={15} /> 确认
                    </button>
                  </>
                )}
                {step === "caption" && (
                  <button
                    onClick={handleSubmit}
                    disabled={!originalFile || isUploading}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={17} />
                        上传
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
