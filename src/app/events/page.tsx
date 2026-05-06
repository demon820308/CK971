"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { ActivityRecords } from "@/components/sections/ActivityRecords"
import { FloatingActions } from "@/components/layout/FloatingActions"

export default function EventsPage() {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <>
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/all.png')",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />

      <Navbar />

      <main
        className="relative z-10 min-h-screen pt-16 pb-16"
        style={{
          background:
            "linear-gradient(to bottom, rgba(100,52,24,0.82) 0%, rgba(58,37,24,0.90) 15%, rgba(44,24,12,0.93) 40%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-amber-300/80 hover:text-amber-200 transition-colors font-handwritten text-sm"
          >
            <ArrowLeft size={16} />
            返回主页
          </Link>
        </div>

        <ActivityRecords
          composeOpen={composeOpen}
          onCloseCompose={() => setComposeOpen(false)}
        />
      </main>

      <FloatingActions
        onUploadPhoto={() => {}}
        onWriteMessage={() => {}}
        onCreateEvent={() => setComposeOpen(true)}
      />
    </>
  )
}
