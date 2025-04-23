"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "李明",
    role: "公务员考试学员",
    image: "/placeholder.svg?height=80&width=80",
    content:
      "学习搭子彻底改变了我的备考方式。AI伙伴小雪不仅帮我整理知识点，还在我情绪低落时给予鼓励。最终我顺利通过了公务员考试，感谢学习搭子的陪伴！",
    rating: 5,
  },
  {
    id: 2,
    name: "张婷",
    role: "教师资格证考生",
    image: "/placeholder.svg?height=80&width=80",
    content:
      "备考教资的过程中，学习搭子的智能题库和笔记功能帮了我大忙。AI伙伴会根据我的错题分析我的弱点，有针对性地推荐练习。界面设计也很舒适，让学习不再枯燥。",
    rating: 5,
  },
  {
    id: 3,
    name: "王浩",
    role: "法考学员",
    image: "/placeholder.svg?height=80&width=80",
    content:
      "法考内容繁多，没有学习搭子我可能坚持不下来。它的学习计划很科学，AI伙伴小阳总能用生动的例子解释复杂的法律概念。最重要的是，有人陪伴的感觉真的很棒！",
    rating: 4,
  },
  {
    id: 4,
    name: "赵雪",
    role: "考研学生",
    image: "/placeholder.svg?height=80&width=80",
    content:
      "考研期间用了学习搭子，最喜欢它的3D角色和情感交流功能。当我熬夜复习感到疲惫时，AI伙伴会适时提醒我休息，还会分享一些减压方法。学习效率提高了不少！",
    rating: 5,
  },
]

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-purple-950 to-black">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            学员<span className="text-purple-400">心声</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">听听他们是如何通过学习搭子提升学习体验的</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full flex flex-col justify-between">
            <div>
              <div className="flex mb-6">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
                {[...Array(5 - testimonials[activeIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-white/20" />
                ))}
              </div>
              <blockquote className="text-xl mb-8">"{testimonials[activeIndex].content}"</blockquote>
            </div>
            <div className="flex items-center">
              <div className="relative h-14 w-14 rounded-full overflow-hidden mr-4">
                <Image
                  src={testimonials[activeIndex].image || "/placeholder.svg"}
                  alt={testimonials[activeIndex].name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold">{testimonials[activeIndex].name}</div>
                <div className="text-white/60">{testimonials[activeIndex].role}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className={`cursor-pointer p-6 rounded-xl transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/20"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
                onClick={() => setActiveIndex(index)}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-white/20" />
                  ))}
                </div>
                <p className="text-sm text-white/70 line-clamp-3">"{testimonial.content}"</p>
                <div className="flex items-center mt-4">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium">{testimonial.name}</div>
                    <div className="text-xs text-white/60">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
