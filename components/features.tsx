"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, Calendar, Clock, FileText, MessageSquare, Sparkles, Award } from "lucide-react"

const features = [
  {
    icon: <MessageSquare className="h-10 w-10" />,
    title: "情感陪伴",
    description: "多种精致动态AI形象，语音情感丰富，为你提供全天候的情感支持",
    color: "from-purple-500 to-pink-500",
    delay: 0.1,
  },
  {
    icon: <BookOpen className="h-10 w-10" />,
    title: "专业知识库",
    description: "根据各科目考试资料构建的专业知识库，确保回答准确权威",
    color: "from-blue-500 to-indigo-500",
    delay: 0.2,
  },
  {
    icon: <Calendar className="h-10 w-10" />,
    title: "目标规划",
    description: "为新用户量身定制考试选择和目标规划，制定科学的学习计划",
    color: "from-pink-500 to-rose-500",
    delay: 0.3,
  },
  {
    icon: <Clock className="h-10 w-10" />,
    title: "学习追踪",
    description: "实时计算并展示每日学习时长，督促完成计划并给予奖励",
    color: "from-green-500 to-emerald-500",
    delay: 0.4,
  },
  {
    icon: <FileText className="h-10 w-10" />,
    title: "真题题库",
    description: "各科目配备历年真题题库，定期更新，助你掌握考试重点",
    color: "from-amber-500 to-yellow-500",
    delay: 0.5,
  },
  {
    icon: <Brain className="h-10 w-10" />,
    title: "智能笔记",
    description: "支持文字、文档、拍照记录学习笔记，自动生成精美思维导图",
    color: "from-violet-500 to-purple-500",
    delay: 0.6,
  },
  {
    icon: <Sparkles className="h-10 w-10" />,
    title: "AI辅导",
    description: "智能分析学习弱点，提供个性化辅导方案，提高学习效率",
    color: "from-cyan-500 to-blue-500",
    delay: 0.7,
  },
  {
    icon: <Award className="h-10 w-10" />,
    title: "成就系统",
    description: "完成学习目标获得成就徽章，激励持续学习，培养良好习惯",
    color: "from-red-500 to-orange-500",
    delay: 0.8,
  },
]

export function Features() {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <section className="py-24 px-4 bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            全方位的<span className="text-purple-400">考试辅助</span>体验
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            学习搭子不仅仅是一个学习工具，更是你备考路上的情感伙伴
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: feature.delay }}
              viewport={{ once: true }}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative z-10 h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                ></div>
                <div
                  className={`mb-6 rounded-xl bg-gradient-to-br ${feature.color} p-3 w-16 h-16 flex items-center justify-center text-white`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
              {hoveredIndex === index && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300 animate-pulse"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
