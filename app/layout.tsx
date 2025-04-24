import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '学习搭子',
  description: '考试学习AI助手',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="dark">
      <body className={cn(
        "min-h-screen bg-background antialiased",
        inter.className
      )}>
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}
