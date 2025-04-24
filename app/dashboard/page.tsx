"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, 
  Calendar,
  CheckCircle, 
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart, 
  MessageSquare,
  Settings,
  TrendingUp, 
  User,
  BookOpen,
  Award,
  Medal,
  CheckCircle2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/80 via-indigo-950/80 to-black"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-pink-600/20 blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-4 px-6 backdrop-blur-md bg-black/10 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-spin-slow opacity-70 group-hover:opacity-100"></div>
                <div className="relative h-full w-full rounded-full bg-black flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
          </div>
            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
              学习搭子
            </span>
                </Link>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-white hover:bg-white/10">
                <Clock className="h-4 w-4" />
                今日学习: 2小时30分钟
              </Button>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <User className="h-5 w-5 relative z-10" />
              </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col space-y-6">
            {/* Dashboard header */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">仪表盘</h1>
                <p className="text-white/60">今天是个学习的好日子，继续努力！</p>
            </div>
              <div className="flex items-center gap-2">
                <Link href="/chat">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-purple-500/20 hover:from-pink-600 hover:to-purple-600">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    开始学习
              </Button>
                </Link>
              </div>
          </div>

            {/* Summary cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg transition-all hover:shadow-xl hover:bg-white/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">学习目标</CardTitle>
                  <CardDescription className="text-white/60">今日学习目标完成情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="text-3xl font-bold">80%</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>行政法</span>
                      <span>4/5</span>
                    </div>
                    <Progress value={80} className="h-2 bg-white/20" />
                  </div>
                  </CardContent>
                <CardFooter className="pt-0">
                  <div className="inline-flex items-center rounded-full bg-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-pink-500">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    比昨天提高10%
                  </div>
                </CardFooter>
                </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg transition-all hover:shadow-xl hover:bg-white/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">学习时长</CardTitle>
                  <CardDescription className="text-white/60">今日学习总时长</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="text-3xl font-bold">2小时30分</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>目标时长</span>
                      <span>3小时</span>
                    </div>
                    <Progress value={83} className="h-2 bg-white/20" />
                  </div>
                  </CardContent>
                <CardFooter className="pt-0">
                  <div className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-500">
                    <Clock className="mr-1 h-3 w-3" />
                    还差30分钟
                  </div>
                </CardFooter>
                </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg transition-all hover:shadow-xl hover:bg-white/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">知识掌握</CardTitle>
                  <CardDescription className="text-white/60">今日知识点掌握情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="text-3xl font-bold">15个</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>掌握程度</span>
                      <span>良好</span>
                    </div>
                    <Progress value={75} className="h-2 bg-white/20" />
                  </div>
                  </CardContent>
                <CardFooter className="pt-0">
                  <div className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    已巩固12个
                  </div>
                </CardFooter>
                </Card>
              <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg transition-all hover:shadow-xl hover:bg-white/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">考试倒计时</CardTitle>
                  <CardDescription className="text-white/60">距离目标考试还有</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="text-3xl font-bold">87天</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>备考进度</span>
                      <span>35%</span>
                    </div>
                    <Progress value={35} className="h-2 bg-white/20" />
                  </div>
                  </CardContent>
                <CardFooter className="pt-0">
                  <div className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    法律职业资格考试
                  </div>
                </CardFooter>
                </Card>
              </div>

            {/* Main dashboard content */}
            <div className="grid gap-6 md:grid-cols-6">
              {/* Left column */}
              <div className="col-span-full md:col-span-4 space-y-6">
                <Card className="overflow-hidden bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                    <CardTitle>学习进度</CardTitle>
                      <CardDescription className="text-white/60">最近30天学习情况</CardDescription>
                        </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 text-white hover:bg-white/10">
                        <LineChart className="mr-2 h-4 w-4" />
                        详情
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      {/* Placeholder for chart */}
                      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                        <div className="flex flex-col items-center text-center">
                          <BarChart className="h-10 w-10 text-white/40" />
                          <div className="mt-2 text-sm text-white/60">图表数据加载中...</div>
                          </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg">
                  <CardHeader>
                    <CardTitle>今日学习任务</CardTitle>
                    <CardDescription className="text-white/60">查看今天的学习计划和任务</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-3 shadow-inner">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">民法总则复习</div>
                            <div className="text-xs text-white/60">9:00 - 10:30</div>
                          </div>
                          <div className="mt-0.5 text-xs text-white/60">已完成 • 1小时30分钟</div>
                        </div>
                      </div>

                      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-3 shadow-inner">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">民法题目练习</div>
                            <div className="text-xs text-white/60">10:45 - 11:45</div>
                          </div>
                          <div className="mt-0.5 text-xs text-white/60">已完成 • 1小时</div>
                        </div>
                      </div>

                      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-3 shadow-inner">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/10">
                          <BookOpen className="h-5 w-5 text-pink-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">行政法复习</div>
                            <div className="text-xs text-white/60">14:00 - 16:00</div>
                          </div>
                          <div className="mt-0.5 text-xs text-white/60">进行中 • 预计2小时</div>
                        </div>
                      </div>

                      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-3 shadow-inner">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                          <FileText className="h-5 w-5 text-white/60" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">每日知识点回顾</div>
                            <div className="text-xs text-white/60">19:00 - 20:00</div>
                      </div>
                          <div className="mt-0.5 text-xs text-white/60">未开始 • 预计1小时</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column */}
              <div className="col-span-full md:col-span-2 space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg">
                  <CardHeader>
                    <CardTitle>个人资料</CardTitle>
                    <CardDescription className="text-white/60">你的学习数据和成就</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-violet-500 p-0.5">
                      <div className="h-full w-full rounded-full overflow-hidden">
                        <Image
                          src="/placeholder.svg"
                          alt="用户头像"
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      </div>
                        </div>
                    <h3 className="mt-3 text-lg font-bold">李明</h3>
                    <p className="text-sm text-white/60">法律职业资格考试备考学员</p>
                    <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/5 p-2">
                        <div className="text-lg font-bold">87</div>
                        <div className="text-xs text-white/60">天数</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <div className="text-lg font-bold">42</div>
                        <div className="text-xs text-white/60">小时</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2">
                        <div className="text-lg font-bold">180</div>
                        <div className="text-xs text-white/60">知识点</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/10 text-white shadow-lg">
                  <CardHeader>
                    <CardTitle>学习成就</CardTitle>
                    <CardDescription className="text-white/60">你获得的徽章和成就</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                          <Award className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <div className="font-medium">连续学习</div>
                          <div className="text-xs text-white/60">连续学习7天</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
                          <Medal className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                          <div className="font-medium">题目达人</div>
                          <div className="text-xs text-white/60">完成500道练习题</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20">
                          <GraduationCap className="h-6 w-6 text-pink-500" />
                        </div>
                        <div>
                          <div className="font-medium">知识精通</div>
                          <div className="text-xs text-white/60">掌握100个重点知识</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
                      </div>
                    </div>
        </div>
      </main>
    </div>
  )
}
