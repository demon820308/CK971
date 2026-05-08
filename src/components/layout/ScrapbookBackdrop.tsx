"use client"

import type { ReactNode } from "react"

interface ScrapbookBackdropProps {
  children?: ReactNode
  mobileClassName?: string
}

export function ScrapbookBackdrop({
  children,
  mobileClassName = "",
}: ScrapbookBackdropProps) {
  return (
    <>
      <div
        className="hidden md:block fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/all.png')",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
        aria-hidden="true"
      />

      <div
        className={`relative w-full aspect-[1682/2528] overflow-hidden md:hidden ${mobileClassName}`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/all.png')",
            backgroundSize: "cover",
            backgroundPosition: "top center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {children}
      </div>
    </>
  )
}
