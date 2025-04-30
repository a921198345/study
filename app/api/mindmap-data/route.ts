import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 定义静态JSON文件的URL
    // 在Vercel这样的无服务器环境中，我们不能直接访问文件系统
    // 所以改用Next.js公共目录中的JSON数据
    const jsonUrl = '/data/opml/2025-04-28T11-12-33-489Z-__.json';
    
    // 使用fetch请求数据（即使是本地文件也可以工作）
    const response = await fetch(new URL(jsonUrl, request.url));
    
    if (!response.ok) {
      console.error('无法加载思维导图数据: ', response.statusText);
      return NextResponse.json(
        { error: '民法思维导图文件未找到' },
        { status: 404 }
      );
    }
    
    // 解析JSON数据
    const mindmapData = await response.json();
    
    // 返回数据
    return NextResponse.json(mindmapData);
  } catch (error) {
    console.error('加载思维导图出错:', error);
    return NextResponse.json(
      { error: '加载思维导图数据失败' },
      { status: 500 }
    );
  }
} 