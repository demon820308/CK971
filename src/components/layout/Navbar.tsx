"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { User, LogOut } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-2 md:top-4 md:right-4 md:left-auto md:max-w-xs md:justify-end md:gap-3">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-handwritten text-amber-100 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:px-3 md:py-1.5 md:text-sm"
      >
        首页
      </button>
      <button
        onClick={() => scrollTo("photos")}
        className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-handwritten text-amber-100 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:px-3 md:py-1.5 md:text-sm"
      >
        相册
      </button>
      <button
        onClick={() => scrollTo("messages")}
        className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-handwritten text-amber-100 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:px-3 md:py-1.5 md:text-sm"
      >
        留言
      </button>
      <button
        onClick={() => scrollTo("events")}
        className="rounded-full bg-amber-100/15 px-2.5 py-1 text-xs font-handwritten text-amber-100 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:px-3 md:py-1.5 md:text-sm"
      >
        活动报名
      </button>

      {session?.user ? (
        <>
          <span className="hidden text-xs font-handwritten text-amber-100/80 sm:inline md:text-sm">
            {session.user.name}
          </span>
          <button
            onClick={() => signOut()}
            className="rounded-full bg-amber-100/15 p-1.5 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:p-2"
            title="退出登录"
          >
            <LogOut size={16} className="text-amber-100 md:size-[18px]" />
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded-full bg-amber-100/15 p-1.5 backdrop-blur-sm transition-colors hover:bg-amber-100/25 md:p-2"
          title="登录"
        >
          <User size={16} className="text-amber-100 md:size-[18px]" />
        </Link>
      )}
    </nav>
  )
}
