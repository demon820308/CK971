"use client"

import { useState } from "react"
import useSWR from "swr"
import { Navbar } from "@/components/layout/Navbar"
import { FloatingActions } from "@/components/layout/FloatingActions"
import { PhotoMemories } from "@/components/sections/PhotoMemories"
import { MessageBoard } from "@/components/sections/MessageBoard"
import { ActivityRecords } from "@/components/sections/ActivityRecords"
import { TimelineEnding } from "@/components/sections/TimelineEnding"
import { PhotoUploadModal } from "@/components/interactive/PhotoUploadModal"
import { ClassInfoModal } from "@/components/interactive/ClassInfoModal"
import type { ClassInfo } from "@/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * all.png  1682×2528  (ratio 1 : 1.503)
 *
 * Layout map (% from image top):
 *   Sunset hero          4.8 % – 33.6 %
 *   Class info overlay   1.8 % top · 2.8 % left
 *   Corkboard 班级瞬间   36.5 % – 58.8 %
 *   Blackboard 大家留言   60.3 % – 82.4 %
 *   News sheet 最近活动   60.1 % – 84.8 %
 *   Footer               95.8 %
 *
 * Content starts at 36.5 % × 150.30 vw ≈ 55 vw
 */

export default function HomePage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const { data: classInfo } = useSWR<ClassInfo>("/api/classes", fetcher)

  return (
    <>
      {/* ── Fixed scrapbook background ── */}
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

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Class info overlay ── */}
      {classInfo && (
        <button
          onClick={() => setShowClassModal(true)}
          className="fixed z-20 text-left text-white/90 drop-shadow-lg cursor-pointer hover:text-white transition-colors"
          style={{ top: "2.7vw", left: "2.8%", right: "60%" }}
          title="查看班级信息"
        >
          <p className="font-brush text-xl leading-snug">
            {classInfo.name}
          </p>
          {classInfo.schoolName && (
            <p className="font-handwritten text-sm text-white/70 mt-0.5">
              {classInfo.schoolName}
            </p>
          )}
          <p className="font-handwritten text-sm text-white/60 mt-0.5">
            入驻 {classInfo.memberCount} 人 · 青春不散
          </p>
        </button>
      )}

      {/* ── Scrollable content ── */}
      <main className="relative z-10" style={{ marginTop: "55vw" }}>
        <div style={{
          background: "linear-gradient(to bottom, rgba(160,85,35,0.55) 0%, rgba(100,52,24,0.78) 8%, rgba(58,37,24,0.88) 22%, rgba(44,24,12,0.92) 60%)"
        }}>
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
          />
          <TimelineEnding startYear={classInfo?.gradeYear} endYear={classInfo?.endYear} />

          <footer className="py-12 text-center">
            <p className="font-handwritten text-amber-200/60 text-lg">
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
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        classInfo={classInfo ?? null}
      />
    </>
  )
}
