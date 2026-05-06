interface MaskingTapeProps {
  rotation?: number
  position?: "top-left" | "top-right" | "top-center"
  className?: string
}

export function MaskingTape({
  rotation = -15,
  position = "top-center",
  className = "",
}: MaskingTapeProps) {
  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "top-center": "top-2 left-1/2 -translate-x-1/2",
  }

  return (
    <div
      className={`absolute w-20 h-6 bg-white/40 mix-blend-mode-multiply z-10 ${positionClasses[position]} ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  )
}
