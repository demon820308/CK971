"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { ScrapbookBackdrop } from "@/components/layout/ScrapbookBackdrop"
import { PhotoMemories } from "@/components/sections/PhotoMemories"
import { FloatingActions } from "@/components/layout/FloatingActions"
import { PhotoUploadModal } from "@/components/interactive/PhotoUploadModal"

export default function PhotosPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <>
      <ScrapbookBackdrop />

      <Navbar />

      <main
        className="relative z-10 min-h-screen pt-10 pb-16 md:pt-16"
        style={{
          background:
            "linear-gradient(to bottom, rgba(100,52,24,0.82) 0%, rgba(58,37,24,0.90) 15%, rgba(44,24,12,0.93) 40%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-handwritten text-sm text-amber-300/80 transition-colors hover:text-amber-200"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>

        <PhotoMemories />
      </main>

      <FloatingActions
        onUploadPhoto={() => setShowUploadModal(true)}
        onWriteMessage={() => {}}
        onCreateEvent={() => {}}
      />

      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  )
}
