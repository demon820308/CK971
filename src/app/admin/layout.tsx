"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, Users, Image, MessageSquare, Calendar, LogOut, ShieldCheck, MessageCircle, Settings } from "lucide-react"

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "账号管理", icon: Users },
  { href: "/admin/photos", label: "图片管理", icon: Image },
  { href: "/admin/messages", label: "留言管理", icon: MessageSquare },
  { href: "/admin/events", label: "活动管理", icon: Calendar },
  { href: "/admin/comments", label: "回复管理", icon: MessageCircle },
  { href: "/admin/settings", label: "基本信息", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  if (pathname === "/admin/setup") return <>{children}</>

  useEffect(() => {
    if (status === "loading") return
    const role = (session?.user as { role?: string })?.role
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      router.replace("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800 flex items-center gap-2">
          <ShieldCheck size={20} className="text-amber-400" />
          <span className="text-white font-bold text-sm">后台管理</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
