"use client"

import { motion } from "framer-motion"

type DoodleType = "paperPlane" | "heart" | "star" | "smiley" | "arrow" | "camera" | "balloon" | "music"

interface DoodleProps {
  type: DoodleType
  className?: string
  size?: number
  color?: string
}

const doodlePaths: Record<DoodleType, string> = {
  paperPlane: "M2 12L22 2L17 22L12 15L2 12Z M12 15L22 2",
  heart: "M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z",
  star: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
  smiley: "M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 9C8.83 9 9.5 9.67 9.5 10.5C9.5 11.33 8.83 12 8 12C7.17 12 6.5 11.33 6.5 10.5C6.5 9.67 7.17 9 8 9ZM16 9C16.83 9 17.5 9.67 17.5 10.5C17.5 11.33 16.83 12 16 12C15.17 12 14.5 11.33 14.5 10.5C14.5 9.67 15.17 9 16 9ZM12 18C9.24 18 7 15.76 7 13H17C17 15.76 14.76 18 12 18Z",
  arrow: "M5 12H19M19 12L12 5M19 12L12 19",
  camera: "M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z",
  balloon: "M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z",
  music: "M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z",
}

export function Doodle({
  type,
  className = "",
  size = 40,
  color = "rgba(255, 255, 255, 0.3)",
}: DoodleProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={{
        y: [0, -8, 0],
        rotate: [0, 3, -3, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <path d={doodlePaths[type]} />
    </motion.svg>
  )
}
