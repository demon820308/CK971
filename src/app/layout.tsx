import type { Metadata } from "next"
import { ZCOOL_XiaoWei, Caveat } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import { ToastHost } from "@/lib/toast"
import "./globals.css"

const brushFont = ZCOOL_XiaoWei({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush",
  display: "swap",
})

const handwrittenFont = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
  display: "swap",
})

export const metadata: Metadata = {
  title: "青春回忆录 | ClassMemo",
  description: "一个班级的数字记忆空间",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${brushFont.variable} ${handwrittenFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          {children}
          <ToastHost />
        </SessionProvider>
      </body>
    </html>
  )
}
