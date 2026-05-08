"use client"

import { motion } from "framer-motion"
import { Doodle } from "@/components/scrapbook"

interface TimelineEndingProps {
  startYear?: number | null
  endYear?: number | null
}

export function TimelineEnding({ startYear, endYear }: TimelineEndingProps = {}) {
  return (
    <section className="relative px-4 py-16 md:py-20">
      <Doodle type="heart" className="absolute left-[15%] top-10 hidden md:block" size={40} />
      <Doodle type="star" className="absolute right-[15%] bottom-20 hidden md:block" size={35} />

      <motion.div
        className="mx-auto max-w-lg text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="mx-auto mb-6 h-16 w-px bg-amber-200/30 md:mb-8 md:h-20"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        <motion.p
          className="mb-4 font-brush text-2xl text-amber-100 md:mb-6 md:text-4xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          时光不老
        </motion.p>

        <motion.p
          className="mb-6 font-brush text-2xl text-amber-100 md:mb-8 md:text-4xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          我们不散
        </motion.p>

        <motion.div
          className="mx-auto mb-6 h-16 w-px bg-amber-200/30 md:mb-8 md:h-20"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        />

        <motion.p
          className="font-handwritten text-lg text-amber-200/70 md:text-xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          致 · 青春
        </motion.p>

        <motion.p
          className="mt-2 font-handwritten text-base text-amber-200/50 md:text-lg"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
        >
          {startYear && endYear ? `${startYear} - ${endYear}` : startYear ?? endYear ?? ""}
        </motion.p>
      </motion.div>
    </section>
  )
}
