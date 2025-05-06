"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Palette,
  Shirt,
  Sparkles,
  Camera,
  RefreshCw,
  Volume2,
  VolumeX,
  Brain,
} from "lucide-react"

// Character data with greetings
const characters = {
  female: [
    {
      id: "loli",
      name: "小樱",
      type: "萝莉",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Girl+1",
      greeting: "嗨！我是小樱，我会用我的活力帮助你度过每一个学习难关！一起加油吧！",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Girl+1",
      color: "from-pink-400 to-rose-400",
    },
    {
      id: "mature",
      name: "雅琪",
      type: "御姐",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Girl+2",
      greeting: "你好，我是雅琪。我会用我的专业知识和耐心引导你走向成功。相信我，你会进步得很快。",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Girl+2",
      color: "from-purple-400 to-indigo-400",
    },
    {
      id: "gentle",
      name: "小雪",
      type: "温柔少女",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Girl+3",
      greeting: "你好呀~我是小雪，很高兴能陪伴你学习。不管遇到什么困难，我都会在你身边支持你哦！",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Girl+3",
      color: "from-blue-400 to-cyan-400",
    },
    {
      id: "lively",
      name: "小菲",
      type: "活泼少女",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Girl+4",
      greeting: "哇！终于等到你啦！我是小菲，超级期待和你一起学习的每一天！我们要一起创造奇迹哦！",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Girl+4",
      color: "from-violet-400 to-fuchsia-400",
    },
  ],
  male: [
    {
      id: "mature-male",
      name: "子轩",
      type: "大叔",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Boy+1",
      greeting: "你好，我是子轩。作为你的学习伙伴，我会用我的经验和知识帮助你攻克难关。让我们一起努力吧。",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Boy+1",
      color: "from-amber-400 to-orange-400",
    },
    {
      id: "sunny",
      name: "小阳",
      type: "阳光少年",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Boy+2",
      greeting: "嘿！我是小阳！超级高兴认识你！学习路上有我陪伴，保证你每天都充满动力！一起冲吧！",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Boy+2",
      color: "from-yellow-400 to-amber-400",
    },
    {
      id: "cool",
      name: "夜辰",
      type: "冷酷系",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Boy+3",
      greeting: "我是夜辰。虽然我看起来有点冷淡，但在学习上我会非常认真地帮助你。相信我的能力吧。",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Boy+3",
      color: "from-slate-400 to-gray-400",
    },
    {
      id: "prince",
      name: "子默",
      type: "王子系",
      image: "/placeholder.svg?height=500&width=300&text=Anime+Boy+4",
      greeting: "你好，我是子默。很荣幸能成为你的学习伙伴。我会用我的优雅和智慧，陪伴你度过每一个学习时刻。",
      model: "/placeholder.svg?height=600&width=400&text=3D+Model+Boy+4",
      color: "from-indigo-400 to-blue-400",
    },
  ],
}

// Customization options
const customizationOptions = {
  hairStyles: ["长直发", "短发", "卷发", "马尾", "双马尾", "丸子头"],
  hairColors: ["黑色", "棕色", "金色", "红色", "蓝色", "粉色", "紫色"],
  outfits: ["学院风", "休闲", "正装", "运动", "中国风", "哥特风"],
  accessories: ["眼镜", "发卡", "耳环", "项链", "手表", "帽子", "无"],
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [examType, setExamType] = useState("")
  const [aiCharacter, setAiCharacter] = useState("")
  const [aiName, setAiName] = useState("")
  const [userName, setUserName] = useState("")
  const [selectedGender, setSelectedGender] = useState("female")
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [customizationTab, setCustomizationTab] = useState("hair")
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  // Add ref definitions for 3D rendering
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Customization state
  const [hairStyle, setHairStyle] = useState("长直发")
  const [hairColor, setHairColor] = useState("黑色")
  const [outfit, setOutfit] = useState("学院风")
  const [accessory, setAccessory] = useState("无")

  useEffect(() => {
    // Set default selected character when gender changes
    if (selectedGender === "female" && characters.female.length > 0) {
      setSelectedCharacter(characters.female[2]) // Default to gentle girl
      setAiCharacter(characters.female[2].id)
      setAiName(characters.female[2].name)
    } else if (selectedGender === "male" && characters.male.length > 0) {
      setSelectedCharacter(characters.male[1]) // Default to sunny boy
      setAiCharacter(characters.male[1].id)
      setAiName(characters.male[1].name)
    }
  }, [selectedGender])

  // Trigger animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleCharacterSelect = (character: any) => {
    setSelectedCharacter(character);
    setAiCharacter(character.id);
    setAiName(character.name);
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    // Here would be the code to play/stop the character's voice greeting
  };

  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  const handleNext = () => {
    if (step === 1 && !examType) return;
    if (step === 2 && !aiCharacter) return;
    if (step === 3 && (!aiName || !userName)) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push("/chat");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

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

      <header className="relative z-10 w-full py-4 px-6 backdrop-blur-md bg-black/10">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 p-0.5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-spin-slow opacity-70 group-hover:opacity-100"></div>
              <div className="relative h-full w-full rounded-full bg-black flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
              学习搭子
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <User className="h-5 w-5 relative z-10" />
            <span className="sr-only">个人中心</span>
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 py-6">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">返回</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step >= 1
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "border border-white/50 text-white/50"
                    }`}
                  >
                    {step > 1 ? <Check className="h-4 w-4" /> : 1}
                  </div>
                  <div
                    className={`h-0.5 w-8 ${step > 1 ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-white/30"}`}
                  />
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step >= 2
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "border border-white/50 text-white/50"
                    }`}
                  >
                    {step > 2 ? <Check className="h-4 w-4" /> : 2}
                  </div>
                  <div
                    className={`h-0.5 w-8 ${step > 2 ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-white/30"}`}
                  />
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step >= 3
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "border border-white/50 text-white/50"
                    }`}
                  >
                    3
                  </div>
                </div>
                <div className="w-8" />
              </div>
            </div>

            {step === 1 && (
              <Card
                className={`border-none shadow-xl bg-white/5 backdrop-blur-md text-white transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                        选择你的考试类型
                      </h1>
                      <p className="text-white/70">选择你正在准备的考试类型，我们将为你提供专属的学习资源和AI陪伴</p>
                    </div>
                    <RadioGroup value={examType} onValueChange={setExamType} className="grid gap-4 md:grid-cols-3">
                      <Label
                        htmlFor="exam-type-1"
                        className={`flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 hover:bg-white/10 transition-all ${
                          examType === "civil" ? "border-white bg-white/10" : "border-white/30"
                        }`}
                      >
                        <RadioGroupItem value="civil" id="exam-type-1" className="sr-only" />
                        <div className="mb-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 p-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-white"
                          >
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <h3 className="font-medium">考公</h3>
                          <p className="text-sm text-white/70">公务员考试</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="exam-type-2"
                        className={`flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 hover:bg-white/10 transition-all ${
                          examType === "teaching" ? "border-white bg-white/10" : "border-white/30"
                        }`}
                      >
                        <RadioGroupItem value="teaching" id="exam-type-2" className="sr-only" />
                        <div className="mb-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-white"
                          >
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <h3 className="font-medium">教资</h3>
                          <p className="text-sm text-white/70">教师资格证考试</p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="exam-type-3"
                        className={`flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-4 hover:bg-white/10 transition-all ${
                          examType === "law" ? "border-white bg-white/10" : "border-white/30"
                        }`}
                      >
                        <RadioGroupItem value="law" id="exam-type-3" className="sr-only" />
                        <div className="mb-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-white"
                          >
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            <path d="M5 3v4" />
                            <path d="M19 17v4" />
                            <path d="M3 5h4" />
                            <path d="M17 19h4" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <h3 className="font-medium">法考</h3>
                          <p className="text-sm text-white/70">法律职业资格考试</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleNext}
                      disabled={!examType}
                      className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2 rounded-full"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center">
                        下一步
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <div
                className={`grid grid-cols-1 lg:grid-cols-5 gap-6 transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                {/* 3D Character Display */}
                <div className="lg:col-span-3 relative">
                  <div className="bg-gradient-to-b from-indigo-900/30 to-violet-900/30 backdrop-blur-sm rounded-3xl overflow-hidden h-[600px] relative shadow-xl border border-white/10">
                    {/* Stars background */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute rounded-full bg-white"
                          style={{
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.8 + 0.2,
                            animation: `twinkle ${Math.random() * 5 + 3}s infinite`,
                          }}
                        />
                      ))}
                    </div>

                    {/* 3D Canvas */}
                    <div ref={containerRef} className="absolute inset-0">
                      <canvas ref={canvasRef} className="w-full h-full" />
                    </div>

                    {/* Character model */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {selectedCharacter && (
                        <div className="relative h-full w-full flex items-end justify-center">
                          <Image
                            src={selectedCharacter.model || "/placeholder.svg"}
                            alt={selectedCharacter.name}
                            width={400}
                            height={600}
                            className="object-contain h-[90%] w-auto max-w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Control buttons */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                        onClick={toggleSpeech}
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                        onClick={toggleRotation}
                      >
                        <RefreshCw className={`h-4 w-4 ${isRotating ? "" : "opacity-50"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Character greeting */}
                    {selectedCharacter && (
                      <div className="absolute bottom-6 left-0 right-0 px-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-full bg-gradient-to-r ${selectedCharacter.color} flex items-center justify-center text-white font-bold shrink-0`}
                            >
                              {selectedCharacter.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-white mb-1">{selectedCharacter.name}</div>
                              <p className="text-white/80 text-sm">{selectedCharacter.greeting}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Character Selection and Customization */}
                <div className="lg:col-span-2">
                  <Card className="border-none shadow-xl bg-white/5 backdrop-blur-md text-white h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                            选择你的AI伙伴
                          </h1>
                          <p className="text-white/70 text-sm">选择一个你喜欢的AI形象，它将陪伴你完成整个备考过程</p>
                        </div>

                        {/* Gender tabs */}
                        <Tabs value={selectedGender} onValueChange={setSelectedGender} className="w-full">
                          <TabsList className="grid grid-cols-2 bg-white/10 w-full mb-4">
                            <TabsTrigger value="female" className="data-[state=active]:bg-white/20 text-white">
                              女性角色
                            </TabsTrigger>
                            <TabsTrigger value="male" className="data-[state=active]:bg-white/20 text-white">
                              男性角色
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="female" className="mt-0">
                            <div className="grid grid-cols-2 gap-3">
                              {characters.female.map((character) => (
                                <div
                                  key={character.id}
                                  className={`rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-white/10 ${
                                    aiCharacter === character.id ? "border-white bg-white/10" : "border-white/30"
                                  }`}
                                  onClick={() => handleCharacterSelect(character)}
                                >
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`mb-2 h-16 w-16 overflow-hidden rounded-full bg-gradient-to-r ${character.color}`}
                                    >
                                      <Image
                                        src={character.image || "/placeholder.svg"}
                                        alt={character.name}
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="text-center">
                                      <h3 className="font-medium">{character.name}</h3>
                                      <p className="text-xs text-white/70">{character.type}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="male" className="mt-0">
                            <div className="grid grid-cols-2 gap-3">
                              {characters.male.map((character) => (
                                <div
                                  key={character.id}
                                  className={`rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-white/10 ${
                                    aiCharacter === character.id ? "border-white bg-white/10" : "border-white/30"
                                  }`}
                                  onClick={() => handleCharacterSelect(character)}
                                >
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`mb-2 h-16 w-16 overflow-hidden rounded-full bg-gradient-to-r ${character.color}`}
                                    >
                                      <Image
                                        src={character.image || "/placeholder.svg"}
                                        alt={character.name}
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="text-center">
                                      <h3 className="font-medium">{character.name}</h3>
                                      <p className="text-xs text-white/70">{character.type}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Customization section */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-medium flex items-center text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                              <Sparkles className="h-4 w-4 mr-2 text-white" />
                              个性化定制
                            </h2>
                          </div>

                          <Tabs value={customizationTab} onValueChange={setCustomizationTab} className="w-full">
                            <TabsList className="grid grid-cols-3 bg-white/10 w-full mb-3">
                              <TabsTrigger
                                value="hair"
                                className="data-[state=active]:bg-white/20 text-white text-xs py-1"
                              >
                                <Palette className="h-3 w-3 mr-1" />
                                发型发色
                              </TabsTrigger>
                              <TabsTrigger
                                value="outfit"
                                className="data-[state=active]:bg-white/20 text-white text-xs py-1"
                              >
                                <Shirt className="h-3 w-3 mr-1" />
                                服装
                              </TabsTrigger>
                              <TabsTrigger
                                value="accessories"
                                className="data-[state=active]:bg-white/20 text-white text-xs py-1"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                配饰
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="hair" className="mt-0 space-y-3">
                              <div>
                                <Label className="text-sm text-white/80 mb-1 block">发型</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {customizationOptions.hairStyles.map((style) => (
                                    <Button
                                      key={style}
                                      variant="outline"
                                      size="sm"
                                      className={`text-xs h-8 ${
                                        hairStyle === style ? "bg-white/20 border-white" : "bg-white/5 border-white/30"
                                      }`}
                                      onClick={() => setHairStyle(style)}
                                    >
                                      {style}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm text-white/80 mb-1 block">发色</Label>
                                <div className="grid grid-cols-7 gap-2">
                                  {customizationOptions.hairColors.map((color) => (
                                    <Button
                                      key={color}
                                      variant="outline"
                                      size="sm"
                                      className={`p-0 w-8 h-8 rounded-full ${
                                        hairColor === color
                                          ? "ring-2 ring-white ring-offset-2 ring-offset-indigo-500"
                                          : ""
                                      }`}
                                      style={{
                                        backgroundColor:
                                          color === "黑色"
                                            ? "#111"
                                            : color === "棕色"
                                              ? "#8B4513"
                                              : color === "金色"
                                                ? "#FFD700"
                                                : color === "红色"
                                                  ? "#FF4500"
                                                  : color === "蓝色"
                                                    ? "#1E90FF"
                                                    : color === "粉色"
                                                      ? "#FF69B4"
                                                      : color === "紫色"
                                                        ? "#9370DB"
                                                        : "#000",
                                      }}
                                      onClick={() => setHairColor(color)}
                                    >
                                      <span className="sr-only">{color}</span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="outfit" className="mt-0">
                              <Label className="text-sm text-white/80 mb-1 block">服装风格</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {customizationOptions.outfits.map((style) => (
                                  <Button
                                    key={style}
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs h-8 ${
                                      outfit === style ? "bg-white/20 border-white" : "bg-white/5 border-white/30"
                                    }`}
                                    onClick={() => setOutfit(style)}
                                  >
                                    {style}
                                  </Button>
                                ))}
                              </div>
                            </TabsContent>

                            <TabsContent value="accessories" className="mt-0">
                              <Label className="text-sm text-white/80 mb-1 block">配饰</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {customizationOptions.accessories.map((item) => (
                                  <Button
                                    key={item}
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs h-8 ${
                                      accessory === item ? "bg-white/20 border-white" : "bg-white/5 border-white/30"
                                    }`}
                                    onClick={() => setAccessory(item)}
                                  >
                                    {item}
                                  </Button>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={handleNext}
                          disabled={!aiCharacter}
                          className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2 rounded-full"
                        >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative z-10 flex items-center">
                            下一步
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {step === 3 && (
              <Card
                className={`border-none shadow-xl bg-white/5 backdrop-blur-md text-white transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                        给你们取个名字
                      </h1>
                      <p className="text-white/70">为你和你的AI伙伴取一个名字，这将是你们之间的专属称呼</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ai-name" className="text-white">
                          AI伙伴的名字
                        </Label>
                        <Input
                          id="ai-name"
                          placeholder="例如：小雪、小智、晓风"
                          value={aiName}
                          onChange={(e) => setAiName(e.target.value)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user-name" className="text-white">
                          你的名字
                        </Label>
                        <Input
                          id="user-name"
                          placeholder="例如：小李、小王、小张"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleNext}
                      disabled={!aiName || !userName}
                      className="relative overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-6 py-2 rounded-full"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center">
                        开始学习
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
