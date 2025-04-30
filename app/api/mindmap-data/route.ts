import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 从URL获取思维导图ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '1745821419752-03、2025民法客观题思维导图_共45页';
    
    // 尝试从文件加载思维导图数据
    const filePath = path.join(process.cwd(), 'data/pdfs', `${id}-tree.json`);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch (error) {
      // 如果文件不存在，可以尝试从数据库加载，或返回404
      return NextResponse.json(
        { error: 'Mindmap not found' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const mindmapData = JSON.parse(fileContent);
    
    // 返回数据
    return NextResponse.json(mindmapData);
  } catch (error) {
    console.error('Error loading mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to load mindmap data' },
      { status: 500 }
    );
  }
} 