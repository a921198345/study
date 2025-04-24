"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Mic,
  PanelLeft,
  PanelRight,
  Send,
  Sparkles,
  Check,
  User,
  Camera,
  Paperclip,
  ImageIcon,
  Smile,
  Volume2,
  Maximize2,
  Minimize2,
  VolumeX,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "欢迎回来！你今天想要复习哪个科目？",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInput("")

    // 调用API获取回答
    const fetchAnswer = async () => {
      try {
        // 显示加载状态
        const loadingMessage: Message = {
          id: 'loading-' + Date.now().toString(),
          content: '思考中...',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // 调用知识库API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: input }),
        });
        
        if (!response.ok) {
          throw new Error('API请求失败');
        }
        
        const data = await response.json();
        
        // 移除加载消息
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
        
        // 添加AI回答
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.answer || '抱歉，我无法回答这个问题。',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('获取回答时出错:', error);
        
        // 移除加载消息
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('loading-')));
        
        // 添加错误消息
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: '抱歉，我遇到了问题，无法处理你的请求。请稍后再试。',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    };
    
    // 执行API调用
    fetchAnswer();
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking)
    // Here would be the code to play/stop the character's voice
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-hidden">
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

      <header className="relative z-10 w-full py-4 px-6 backdrop-blur-md bg-black/10 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-0.5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-spin-slow opacity-70 group-hover:opacity-100"></div>
              <div className="relative h-full w-full rounded-full bg-black flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white hover:bg-white/10"
            >
              {showSidebar ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <User className="h-5 w-5 relative z-10" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div
          className={`flex flex-1 flex-col overflow-hidden transition-all duration-500 ${isFullscreen ? "w-full" : ""}`}
        >
          <div className="flex-1 overflow-auto p-4">
            <div
              className={`mx-auto max-w-3xl space-y-4 pb-20 transition-all duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            >
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {message.sender === "ai" && (
                    <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      小
                    </div>
                  )}
                  <div className={`ml-2 max-w-[80%] ${message.sender === "user" ? "mr-2" : ""}`}>
                    <div
                      className={`rounded-2xl p-4 ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-sm text-white"
                          : "bg-gradient-to-r from-pink-500/80 to-purple-500/80 backdrop-blur-sm text-white"
                      } ${message.sender === "ai" ? "rounded-tl-none" : "rounded-tr-none"} shadow-lg border border-white/10`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div
                      className={`mt-1 flex items-center text-xs text-white/60 ${
                        message.sender === "user" ? "justify-end" : ""
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      李
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* AI Character Visualization */}
          <div
            className={`absolute bottom-20 right-4 w-40 h-40 transition-all duration-500 ${isFullscreen ? "w-60 h-60" : ""}`}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full overflow-hidden border border-white/10 bg-gradient-to-r from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 animate-pulse"></div>
                <div className="relative z-10 text-white text-4xl font-bold">AI</div>
              </div>
              <div className="absolute -top-1 -right-1 flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 text-white"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 text-white"
                  onClick={toggleSpeech}
                >
                  {isSpeaking ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 backdrop-blur-md p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">附件</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <ImageIcon className="h-5 w-5" />
                    <span className="sr-only">图片</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <Camera className="h-5 w-5" />
                    <span className="sr-only">拍照</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">语音</span>
                  </Button>
                </div>
                <div className="relative flex-1">
                  <Input
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 pr-10 rounded-full h-10"
                    placeholder="输入你的问题..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="absolute right-0 top-0 h-full flex items-center pr-3 space-x-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white/60 hover:text-white">
                      <Smile className="h-4 w-4" />
                      <span className="sr-only">表情</span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white/60 hover:text-white">
                      <Sparkles className="h-4 w-4" />
                      <span className="sr-only">AI建议</span>
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
                  onClick={handleSendMessage}
                >
                  <Send className="h-5 w-5 text-white" />
                  <span className="sr-only">发送</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showSidebar && (
          <div className="hidden w-80 border-l border-white/10 bg-white/5 backdrop-blur-md md:block">
            <Tabs defaultValue="profile">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                <TabsList className="grid w-full grid-cols-3 bg-white/10">
                  <TabsTrigger value="profile" className="data-[state=active]:bg-white/20 text-white">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">资料</span>
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="data-[state=active]:bg-white/20 text-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">计划</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-white/20 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">笔记</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="profile" className="p-4 text-white">
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-violet-500 p-0.5">
                      <div className="h-full w-full rounded-full overflow-hidden">
                        <Image
                          src="/placeholder.svg"
                          alt="AI形象"
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium">小雪</h3>
                    <p className="text-sm text-white/70">温柔可爱少女</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 shadow-lg">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">学习统计</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-white/10 p-2">
                          <div className="text-xs text-white/70">今日学习</div>
                          <div className="text-lg font-bold">2小时30分</div>
                        </div>
                        <div className="rounded-md bg-white/10 p-2">
                          <div className="text-xs text-white/70">累计学习</div>
                          <div className="text-lg font-bold">42小时</div>
                        </div>
                        <div className="rounded-md bg-white/10 p-2">
                          <div className="text-xs text-white/70">完成任务</div>
                          <div className="text-lg font-bold">12/15</div>
                        </div>
                        <div className="rounded-md bg-white/10 p-2">
                          <div className="text-xs text-white/70">连续学习</div>
                          <div className="text-lg font-bold">7天</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 shadow-lg">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">考试信息</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-white/70">考试类型</span>
                          <span className="text-sm font-medium">法律职业资格考试</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-white/70">当前阶段</span>
                          <span className="text-sm font-medium">基础复习</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-white/70">距离考试</span>
                          <span className="text-sm font-medium">87天</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              {/* 其他内容保持不变 */}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
} 