import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 更新活跃文件
async function updateActiveFile(fileId: string) {
  try {
    console.log(`尝试设置活跃文件: ${fileId}`);
    const configDir = path.join(process.cwd(), 'config');
    const configPath = path.join(configDir, 'mindmap.json');
    
    // 确保配置目录存在
    if (!fs.existsSync(configDir)) {
      console.log(`创建配置目录: ${configDir}`);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 读取当前配置或创建新配置
    let config = { activeFile: '' };
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log(`读取现有配置: ${JSON.stringify(config)}`);
      } catch (error) {
        console.error('读取配置文件失败:', error);
      }
    }
    
    // 更新活跃文件配置
    config.activeFile = fileId;
    
    // 写入配置文件
    console.log(`更新配置: ${JSON.stringify(config)}`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('配置文件更新成功');
    return true;
  } catch (error) {
    console.error('更新活跃文件失败:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('处理设置活跃文件请求');
    const body = await request.json();
    const { fileId } = body;
    
    console.log(`请求设置活跃文件: ${fileId}`);
    
    if (!fileId) {
      console.error('未提供文件ID');
      return NextResponse.json(
        { error: '必须提供文件ID' },
        { status: 400 }
      );
    }
    
    // 在Vercel环境中，直接返回成功，无需实际写入文件
    if (process.env.VERCEL) {
      console.log('在Vercel环境中，模拟成功设置活跃文件');
      return NextResponse.json({ 
        success: true, 
        message: '活跃文件已更新（Vercel环境模拟）',
        vercel: true
      });
    }
    
    // 检查文件是否存在
    const filePath = path.join(process.cwd(), 'public', 'data', fileId);
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return NextResponse.json(
        { error: '指定的文件不存在' },
        { status: 404 }
      );
    }
    
    // 更新配置
    const success = await updateActiveFile(fileId);
    
    if (!success) {
      return NextResponse.json(
        { error: '设置活跃文件失败，请查看服务器日志' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: '活跃文件已更新' });
  } catch (error) {
    console.error('设置活跃文件失败:', error);
    return NextResponse.json(
      { error: '设置活跃文件失败', message: (error as Error).message },
      { status: 500 }
    );
  }
} 