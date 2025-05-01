import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request) {
  try {
    // 从查询参数获取文件路径
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: '未提供文件路径' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: `文件不存在: ${filePath}` },
        { status: 404 }
      );
    }
    
    // 读取JSON文件
    const fileContent = await readFile(filePath, 'utf8');
    
    try {
      // 解析JSON内容
      const jsonData = JSON.parse(fileContent);
      return NextResponse.json(jsonData);
    } catch (parseError) {
      return NextResponse.json(
        { error: '无法解析JSON文件' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取JSON结果错误:', error);
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    );
  }
} 