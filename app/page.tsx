import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Brain, Calendar, Clock, FileText, MessageSquare, User } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-violet-600 via-indigo-500 to-blue-600">
      <header className="w-full py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-10 w-10">
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">学习搭子</span>
          </Link>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <User className="h-5 w-5" />
            <span className="sr-only">个人中心</span>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 opacity-30">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden">
                  <Image
                    src={`/placeholder.svg?height=400&width=300&text=Anime+Character+${i + 1}`}
                    alt={`Anime character ${i + 1}`}
                    width={300}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl xl:text-6xl/none">
                  你的专属学习伙伴，让备考不再孤单
                </h1>
                <p className="max-w-[700px] text-white/80 md:text-xl mx-auto">
                  无论是考公、教资还是法考，学习搭子都将全程陪伴，提供情感支持和专业指导，让学习更有趣、更高效
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/onboarding">
                  <Button
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-white/90 font-semibold text-lg px-8 py-6 rounded-full"
                  >
                    开始你的学习之旅
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative h-[500px] w-full max-w-[400px] mt-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-pink-400/30 blur-3xl"></div>
                <div className="relative z-10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 p-6 h-full w-full overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        小
                      </div>
                      <div>
                        <div className="text-white font-medium">小雪</div>
                        <div className="text-xs text-white/60">温柔可爱少女</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
                      <Clock className="h-3 w-3 text-white/60" />
                      <div className="text-xs text-white/60">今日学习: 2小时</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        小
                      </div>
                      <div className="ml-3 max-w-[80%]">
                        <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-white">
                          <p>嗨，李同学！今天准备复习什么内容呢？我已经为你准备好了行政法第五章的重点笔记！</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="mr-3 max-w-[80%]">
                        <div className="bg-white/20 rounded-2xl rounded-tr-none p-4 text-white">
                          <p>小雪，我今天想复习行政法，能帮我整理一下重点吗？</p>
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        李
                      </div>
                    </div>
                    <div className="flex">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        小
                      </div>
                      <div className="ml-3 max-w-[80%]">
                        <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-white">
                          <p>
                            当然可以！行政法第五章的重点包括：行政处罚的种类、行政处罚的设定与实施、行政强制措施与行政强制执行...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white/60">输入你的问题...</div>
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      >
                        <ArrowRight className="h-5 w-5 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-purple-100 px-3 py-1 text-sm text-purple-600">核心功能</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">全方位的考试辅助体验</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  学习搭子不仅仅是一个学习工具，更是你备考路上的情感伙伴
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-3 w-14 h-14 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">情感陪伴</h3>
                  <p className="text-muted-foreground">多种精致动态AI形象，语音情感丰富，为你提供全天候的情感支持</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 p-3 w-14 h-14 flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">专业知识库</h3>
                  <p className="text-muted-foreground">根据各科目考试资料构建的专业知识库，确保回答准确权威</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 p-3 w-14 h-14 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">目标规划</h3>
                  <p className="text-muted-foreground">为新用户量身定制考试选择和目标规划，制定科学的学习计划</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-3 w-14 h-14 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">学习追踪</h3>
                  <p className="text-muted-foreground">实时计算并展示每日学习时长，督促完成计划并给予奖励</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 p-3 w-14 h-14 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">真题题库</h3>
                  <p className="text-muted-foreground">各科目配备历年真题题库，定期更新，助你掌握考试重点</p>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-violet-200 to-purple-200 opacity-30 blur-2xl transition-all group-hover:opacity-70"></div>
                <div className="relative">
                  <div className="mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 p-3 w-14 h-14 flex items-center justify-center">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">智能笔记</h3>
                  <p className="text-muted-foreground">支持文字、文档、拍照记录学习笔记，自动生成精美思维导图</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-6 text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-white" />
            <p className="text-sm">© 2025 学习搭子. 保留所有权利.</p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="#" className="text-white/80 hover:text-white hover:underline">
              隐私政策
            </Link>
            <Link href="#" className="text-white/80 hover:text-white hover:underline">
              服务条款
            </Link>
            <Link href="#" className="text-white/80 hover:text-white hover:underline">
              联系我们
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
