import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 现在我们只支持民法OPML的思维导图
    const mindmapFile = '2025-04-28T11-12-33-489Z-__.json';
    
    // 从OPML处理后的JSON文件加载思维导图数据
    const filePath = path.join(process.cwd(), 'data/opml', mindmapFile);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: '民法思维导图文件未找到' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const mindmapData = JSON.parse(fileContent);
    
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