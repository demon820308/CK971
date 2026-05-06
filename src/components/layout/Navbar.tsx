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
    <nav className="fixed top-4 right-4 z-50 flex items-center gap-3 flex-wrap justify-end max-w-xs">
      {/* Navigation links */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="px-3 py-1.5 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors text-amber-100 font-handwritten text-sm"
      >
        首页
      </button>
      <button
        onClick={() => scrollTo("photos")}
        className="px-3 py-1.5 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors text-amber-100 font-handwritten text-sm"
      >
        相册
      </button>
      <button
        onClick={() => scrollTo("messages")}
        className="px-3 py-1.5 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors text-amber-100 font-handwritten text-sm"
      >
        留言
      </button>
      <button
        onClick={() => scrollTo("events")}
        className="px-3 py-1.5 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors text-amber-100 font-handwritten text-sm"
      >
        活动报名
      </button>

      {session?.user ? (
        <>
          <span className="text-amber-100/80 font-handwritten text-sm">
            {session.user.name}
          </span>
          <button
            onClick={() => signOut()}
            className="p-2 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors"
            title="退出登录"
          >
            <LogOut size={18} className="text-amber-100" />
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="p-2 bg-amber-100/15 backdrop-blur-sm rounded-full hover:bg-amber-100/25 transition-colors"
          title="登录"
        >
          <User size={18} className="text-amber-100" />
        </Link>
      )}
    </nav>
  )
}
