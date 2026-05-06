"use client"

import { motion } from "framer-motion"
import { Doodle } from "@/components/scrapbook"

interface TimelineEndingProps {
  startYear?: number | null
  endYear?: number | null
}

export function TimelineEnding({ startYear, endYear }: TimelineEndingProps = {}) {
  return (
    <section className="relative py-20 px-4">
      <Doodle type="heart" className="absolute top-10 left-[15%]" size={40} />
      <Doodle type="star" className="absolute bottom-20 right-[15%]" size={35} />

      <motion.div
        className="max-w-lg mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Decorative line */}
        <motion.div
          className="w-px h-20 bg-amber-200/30 mx-auto mb-8"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        <motion.p
          className="font-brush text-3xl md:text-4xl text-amber-100 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          时光不老
        </motion.p>

        <motion.p
          className="font-brush text-3xl md:text-4xl text-amber-100 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          我们不散
        </motion.p>

        <motion.div
          className="w-px h-20 bg-amber-200/30 mx-auto mb-8"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        />

        <motion.p
          className="font-handwritten text-xl text-amber-200/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          致 · 青春
        </motion.p>

        <motion.p
          className="font-handwritten text-lg text-amber-200/50 mt-2"
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
