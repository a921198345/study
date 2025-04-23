"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Trophy,
} from "lucide-react"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoaded, setIsLoaded] = useState(false)

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/80 via-indigo-950/80 to-black"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-pink-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="relative z-10 w-full py-4 px-6 backdrop-blur-md bg-black/10 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-spin-slow opacity-70 group-hover:opacity-100"></div>
                <div className="relative h-full w-full rounded-full bg-black flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">学习搭子</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10">
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  对话
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 relative overflow-hidden group">
                <Link href="/dashboard">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <LayoutDashboard className="mr-2 h-4 w-4 relative z-10" />
                  <span className="relative z-10">仪表盘</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="mr-2 h-4 w-4" />
                设置
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container relative z-10 flex-1 py-6">
        <div className={`flex flex-col space-y-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">仪表盘</h1>
              <p className="text-white/70">查看你的学习进度和计划</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FileText className="mr-2 h-4 w-4 relative z-10" />
                <span className="relative z-10">新建笔记</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white/10 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">总览</TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-white/20 text-white">学习进度</TabsTrigger>
              <TabsTrigger value="plan" className="data-[state=active]:bg-white/20 text-white">学习计划</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-white/20 text-white">笔记</TabsTrigger>
              <TabsTrigger value="exams" className="data-[state=active]:bg-white/20 text-white">题库</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">今日学习时长</CardTitle>
                    <Clock className="h-4 w-4 text-white/70" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2小时30分</div>
                    <p className="text-xs text-white/70">较昨日 <span className="text-green-400">+30分钟</span></p>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">累计学习天数</CardTitle>
                    <Calendar className="h-4 w-4 text-white/70" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">28天</div>
                    <p className="text-xs text-white/70">连续学习 <span className="text-purple-400">7天</span></p>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">完成任务</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-white/70" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12/15</div>
                    <p className="text-xs text-white/70">本周完成率 <span className="text-blue-400">80%</span></p>
                  </CardContent>
                </Card>
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">距离考试</CardTitle>
                    <GraduationCap className="h-4 w-4 text-white/70" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">87天</div>
                    <p className="text-xs text-white/70">法律职业资格考试</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>学习进度</CardTitle>
                    <CardDescription className="text-white/70">各科目学习进度概览</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">行政法</span>
                          <span className="text-sm text-white/70">60%</span>
                        </div>
                        <Progress value={60} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">民法</span>
                          <span className="text-sm text-white/70">45%</span>
                        </div>
                        <Progress value={45} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">刑法</span>
                          <span className="text-sm text-white/70">30%</span>
                        </div>
                        <Progress value={30} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">商法</span>
                          <span className="text-sm text-white/70">20%</span>
                        </div>
                        <Progress value={20} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                        </Progress>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3 border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>学习统计</CardTitle>
                    <CardDescription className="text-white/70">近7天学习时长</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      <div className="flex h-full items-end gap-2">
                        {[40, 60, 100, 80, 120, 150, 130].map((height, i) => (
                          <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
                            <div
                              className="rounded-md w-full bg-gradient-to-t from-indigo-500 to-violet-500"
                              style={{ height: `${(height / 150) * 100}%` }}
                            ></div>
                            <span className="mt-1 text-center text-xs text-white/70">
                              {["一", "二", "三", "四", "五", "六", "日"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>今日任务</CardTitle>
                    <CardDescription className="text-white/70">待完成的学习任务</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">行政法第五章复习</div>
                          <div className="text-xs text-white/70">已完成 | 2小时</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <div className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">行政法习题练习</div>
                          <div className="text-xs text-white/70">未完成 | 1小时</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <div className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">知识点回顾</div>
                          <div className="text-xs text-white/70">未完成 | 30分钟</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>最近笔记</CardTitle>
                    <CardDescription className="text-white/70">最近更新的学习笔记</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-white/10 p-2 hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">行政法重点概念</h4>
                          <span className="text-xs text-white/70">2天前</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">
                          行政法的基本原则包括：合法行政原则、合理行政原则、程序正当原则...
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2 hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">民法典人格权</h4>
                          <span className="text-xs text-white/70">4天前</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">
                          民法典人格权编共有51条，分为一般规定、生命权、身体权和健康权...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>成就与奖励</CardTitle>
                    <CardDescription className="text-white/70">你获得的学习成就</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center space-y-1 rounded-lg border border-white/10 p-2 bg-gradient-to-b from-white/5 to-white/0">
                        <Trophy className="h-8 w-8 text-yellow-400" />
                        <span className="text-xs text-center">完成50道题</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <div className="space-y-4">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>学习进度</CardTitle>
                    <CardDescription className="text-white/70">各科目学习进度概览</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">行政法</span>
                          <span className="text-sm text-white/70">60%</span>
                        </div>
                        <Progress value={60} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">民法</span>
                          <span className="text-sm text-white/70">45%</span>
                        </div>
                        <Progress value={45} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">刑法</span>
                          <span className="text-sm text-white/70">30%</span>
                        </div>
                        <Progress value={30} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                        </Progress>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">商法</span>
                          <span className="text-sm text-white/70">20%</span>
                        </div>
                        <Progress value={20} className="h-2 bg-white/10">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                        </Progress>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="plan">
              <div className="space-y-4">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>学习计划</CardTitle>
                    <CardDescription className="text-white/70">你的个性化学习计划</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">行政法第五章复习</div>
                          <div className="text-xs text-white/70">已完成 | 2小时</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <div className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">行政法习题练习</div>
                          <div className="text-xs text-white/70">未完成 | 1小时</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                          <div className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">知识点回顾</div>
                          <div className="text-xs text-white/70">未完成 | 30分钟</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="space-y-4">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>最近笔记</CardTitle>
                    <CardDescription className="text-white/70">最近更新的学习笔记</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-white/10 p-2 hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">行政法重点概念</h4>
                          <span className="text-xs text-white/70">2天前</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">
                          行政法的基本原则包括：合法行政原则、合理行政原则、程序正当原则...
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 p-2 hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">民法典人格权</h4>
                          <span className="text-xs text-white/70">4天前</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">
                          民法典人格权编共有51条，分为一般规定、生命权、身体权和健康权...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="exams">
              <div className="space-y-4">
                <Card className="border-none bg-white/5 backdrop-blur-md text-white shadow-xl">
                  <CardHeader>
                    <CardTitle>题库</CardTitle>
                    <CardDescription className="text-white/70">在线练习题库</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>敬请期待...</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
