import { NextResponse } from 'next/server';

// 配置CORS响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: '你好！AI学习助手API正常工作中！',
    timestamp: new Date().toISOString()
  }, {
    headers: corsHeaders
  });
} 