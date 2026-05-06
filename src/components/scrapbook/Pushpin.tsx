interface PushpinProps {
  color?: "silver" | "gold" | "red"
  className?: string
}

export function Pushpin({ color = "silver", className = "" }: PushpinProps) {
  const colorMap = {
    silver: "from-gray-300 to-gray-500",
    gold: "from-yellow-400 to-yellow-600",
    red: "from-red-400 to-red-600",
  }

  return (
    <div className={`absolute ${className}`}>
      <div
        className={`w-4 h-4 rounded-full bg-gradient-to-br ${colorMap[color]} shadow-md`}
      />
      <div className="w-1 h-2 bg-gray-400 mx-auto -mt-0.5" />
    </div>
  )
}
