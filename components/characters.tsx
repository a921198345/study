"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const characters = [
  {
    id: 1,
    name: "小雪",
    type: "温柔少女",
    description: "善解人意的学习伙伴，擅长倾听和鼓励，会在你疲惫时提供情感支持",
    image: "/placeholder.svg?height=400&width=300&text=小雪",
    color: "from-pink-500 to-purple-500",
  },
  {
    id: 2,
    name: "雅琪",
    type: "知性御姐",
    description: "知识渊博的学习导师，擅长分析和总结，会帮你梳理知识体系和重点",
    image: "/placeholder.svg?height=400&width=300&text=雅琪",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: 3,
    name: "小阳",
    type: "阳光少年",
    description: "活力四射的学习搭档，擅长激励和挑战，会在你松懈时督促你前进",
    image: "/placeholder.svg?height=400&width=300&text=小阳",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 4,
    name: "子墨",
    type: "稳重学长",
    description: "沉稳可靠的学习顾问，擅长规划和指导，会为你制定科学的学习计划",
    image: "/placeholder.svg?height=400&width=300&text=子墨",
    color: "from-emerald-500 to-teal-500",
  },
]

export function Characters() {
  const [activeCharacter, setActiveCharacter] = useState(characters[0])

  return (
    <section className="py-24 px-4 bg-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            你的<span className="text-purple-400">专属</span>学习伙伴
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">选择一位与你性格相符的AI伙伴，陪你度过备考的每一天</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] max-w-md mx-auto">
              <Image
                src={activeCharacter.image || "/placeholder.svg"}
                alt={activeCharacter.name}
                width={300}
                height={400}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <div className="mb-2">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${activeCharacter.color} text-white`}
                  >
                    {activeCharacter.type}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{activeCharacter.name}</h3>
                <p className="text-white/70 text-sm">{activeCharacter.description}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {characters.map((character) => (
                <motion.div
                  key={character.id}
                  className={`cursor-pointer p-4 rounded-xl transition-all duration-300 ${
                    activeCharacter.id === character.id
                      ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/20"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                  onClick={() => setActiveCharacter(character)}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden mr-3">
                      <Image
                        src={character.image || "/placeholder.svg"}
                        alt={character.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold">{character.name}</div>
                      <div className="text-white/60 text-sm">{character.type}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
              <h3 className="text-xl font-bold mb-4">角色特点</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-medium">个性化交流</span>
                    <p className="text-white/70 text-sm">每位角色都有独特的性格和语言风格</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-medium">情感支持</span>
                    <p className="text-white/70 text-sm">能够识别你的情绪，提供适当的鼓励和安慰</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-medium">学习指导</span>
                    <p className="text-white/70 text-sm">根据你的学习风格提供个性化的学习建议</p>
                  </div>
                </li>
              </ul>
            </div>

            <Link href="/onboarding">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl"
              >
                选择你的学习伙伴
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
