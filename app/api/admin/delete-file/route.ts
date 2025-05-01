import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取当前活跃文件
function getActiveFile(): string {
  const configPath = path.join(process.cwd(), 'config', 'mindmap.json');
  if (!fs.existsSync(configPath)) {
    return '';
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.activeFile || '';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;
    
    // 文件ID不能为空
    if (!fileId) {
      return NextResponse.json(
        { error: true, message: '文件ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查是否是活跃文件
    const activeFile = getActiveFile();
    if (fileId === activeFile) {
      return NextResponse.json(
        { error: true, message: '不能删除当前活跃文件，请先设置其他文件为活跃文件' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    const filePath = path.join(process.cwd(), 'public', 'data', fileId);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: true, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    // 同时尝试删除原始OPML文件（如果存在）
    const opmlFilePath = path.join(process.cwd(), 'public', 'data', 'opml', fileId.replace('.json', '.opml'));
    if (fs.existsSync(opmlFilePath)) {
      fs.unlinkSync(opmlFilePath);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json(
      { error: true, message: '删除文件失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 