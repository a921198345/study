import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 静态JSON文件的URL
    const jsonUrl = '/data/opml/2025-04-28T11-12-33-489Z-__.json';
    
    // 直接重定向到静态JSON文件
    // 这样浏览器会直接获取JSON文件，避免服务器端处理
    return NextResponse.redirect(new URL(jsonUrl, request.nextUrl.origin));
  } catch (error) {
    console.error('思维导图重定向错误:', error);
    return NextResponse.json(
      { error: '加载思维导图数据失败' },
      { status: 500 }
    );
  }
} 