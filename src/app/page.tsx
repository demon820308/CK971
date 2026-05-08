"use client"

import { useState } from "react"
import useSWR from "swr"
import { Navbar } from "@/components/layout/Navbar"
import { FloatingActions } from "@/components/layout/FloatingActions"
import { ScrapbookBackdrop } from "@/components/layout/ScrapbookBackdrop"
import { PhotoMemories } from "@/components/sections/PhotoMemories"
import { MessageBoard } from "@/components/sections/MessageBoard"
import { ActivityRecords } from "@/components/sections/ActivityRecords"
import { TimelineEnding } from "@/components/sections/TimelineEnding"
import { PhotoUploadModal } from "@/components/interactive/PhotoUploadModal"
import { ClassInfoModal } from "@/components/interactive/ClassInfoModal"
import type { ClassInfo } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const { data: classInfo } = useSWR<ClassInfo>("/api/classes", fetcher)

  return (
    <>
      <ScrapbookBackdrop />

      <Navbar />

      {classInfo && (
        <button
          onClick={() => setShowClassModal(true)}
          className="fixed left-4 right-20 top-14 z-20 text-left text-white/90 drop-shadow-lg transition-colors hover:text-white md:left-[2.8%] md:right-[60%] md:top-[2.7vw]"
          title="查看班级信息"
        >
          <p className="font-brush text-lg leading-snug md:text-xl">
            {classInfo.name}
          </p>
          {classInfo.schoolName && (
            <p className="mt-0.5 font-handwritten text-xs text-white/70 md:text-sm">
              {classInfo.schoolName}
            </p>
          )}
          <p className="mt-0.5 font-handwritten text-xs text-white/60 md:text-sm">
            现有 {classInfo.memberCount} 人 · 青春不散
          </p>
        </button>
      )}

      <main className="relative z-10 mt-0 md:mt-[55vw]">
        <div
          style={{
            background:
              "linear-gradient(to bottom, rgba(160,85,35,0.55) 0%, rgba(100,52,24,0.78) 8%, rgba(58,37,24,0.88) 22%, rgba(44,24,12,0.92) 60%)",
          }}
        >
          <PhotoMemories limit={15} topLiked={6} maxPages={1} />
          <MessageBoard
            composeOpen={showMessageModal}
            onCloseCompose={() => setShowMessageModal(false)}
            limit={20}
            topLiked={5}
            maxPages={1}
          />
          <ActivityRecords
            composeOpen={showEventModal}
            onCloseCompose={() => setShowEventModal(false)}
            limit={3}
            maxPages={1}
          />
          <TimelineEnding startYear={classInfo?.gradeYear} endYear={classInfo?.endYear} />

          <footer className="py-12 text-center">
            <p className="font-handwritten text-lg text-amber-200/60">
              时光不老，我们不散
            </p>
          </footer>
        </div>
      </main>

      <FloatingActions
        onUploadPhoto={() => setShowUploadModal(true)}
        onWriteMessage={() => setShowMessageModal(true)}
        onCreateEvent={() => setShowEventModal(true)}
      />

      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      <ClassInfoModal
        key={showClassModal ? classInfo?.id ?? "open" : "closed"}
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        classInfo={classInfo ?? null}
      />
    </>
  )
}
