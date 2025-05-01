import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 更新活跃文件
async function updateActiveFile(fileId: string) {
  const configDir = path.join(process.cwd(), 'config');
  const configPath = path.join(configDir, 'mindmap.json');
  
  // 确保配置目录存在
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // 读取当前配置或创建新配置
  let config = { activeFile: '' };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
      console.error('读取配置文件失败:', error);
    }
  }
  
  // 更新活跃文件配置
  config.activeFile = fileId;
  
  // 写入配置文件
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;
    
    if (!fileId) {
      return NextResponse.json(
        { error: '必须提供文件ID' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    const filePath = path.join(process.cwd(), 'public', 'data', fileId);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '指定的文件不存在' },
        { status: 404 }
      );
    }
    
    // 更新配置
    await updateActiveFile(fileId);
    
    return NextResponse.json({ success: true, message: '活跃文件已更新' });
  } catch (error) {
    console.error('设置活跃文件失败:', error);
    return NextResponse.json(
      { error: '设置活跃文件失败', message: (error as Error).message },
      { status: 500 }
    );
  }
} 