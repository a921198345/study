"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

const stats = [
  { value: 100000, label: "活跃用户", suffix: "+" },
  { value: 500, label: "考试科目", suffix: "+" },
  { value: 98, label: "通过率", suffix: "%" },
  { value: 24, label: "全天候服务", suffix: "h" },
]

export function Stats() {
  return (
    <section className="py-12 bg-black border-y border-white/10">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface StatItemProps {
  value: number;
  label: string;
  suffix?: string;
}

function StatItem({ value, label, suffix }: StatItemProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView) {
      const duration = 2000 // ms
      const frameDuration = 1000 / 60 // 60fps
      const totalFrames = Math.round(duration / frameDuration)
      let frame = 0

      const counter = setInterval(() => {
        frame++
        const progress = frame / totalFrames
        const currentCount = Math.floor(value * progress)

        setCount(currentCount)

        if (frame === totalFrames) {
          clearInterval(counter)
        }
      }, frameDuration)

      return () => clearInterval(counter)
    }
  }, [isInView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        {count}
        {suffix}
      </div>
      <div className="text-white/70 mt-2">{label}</div>
    </motion.div>
  )
}
