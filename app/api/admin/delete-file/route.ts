import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取当前活跃文件
function getActiveFile(): string {
  try {
    console.log('获取当前活跃文件');
    const configPath = path.join(process.cwd(), 'config', 'mindmap.json');
    if (!fs.existsSync(configPath)) {
      console.log('配置文件不存在');
      return '';
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`当前活跃文件: ${config.activeFile || '无'}`);
    return config.activeFile || '';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('处理删除文件请求');
    const body = await request.json();
    const { fileId } = body;
    
    // 文件ID不能为空
    if (!fileId) {
      console.error('未提供文件ID');
      return NextResponse.json(
        { error: true, message: '文件ID不能为空' },
        { status: 400 }
      );
    }
    
    console.log(`请求删除文件: ${fileId}`);
    
    // 检查是否是活跃文件
    const activeFile = getActiveFile();
    if (fileId === activeFile) {
      console.error('尝试删除活跃文件');
      return NextResponse.json(
        { error: true, message: '不能删除当前活跃文件，请先设置其他文件为活跃文件' },
        { status: 400 }
      );
    }
    
    // 在Vercel环境中，模拟删除文件成功
    if (process.env.VERCEL) {
      console.log('在Vercel环境中，模拟删除文件成功');
      return NextResponse.json({ 
        success: true, 
        message: '文件删除成功（Vercel环境模拟）',
        vercel: true
      });
    }
    
    // 检查文件是否存在
    const filePath = path.join(process.cwd(), 'public', 'data', fileId);
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在: ${filePath}`);
      return NextResponse.json(
        { error: true, message: '文件不存在' },
        { status: 404 }
      );
    }
    
    try {
      // 删除文件
      console.log(`删除文件: ${filePath}`);
      fs.unlinkSync(filePath);
      
      // 同时尝试删除原始OPML文件（如果存在）
      const opmlFilePath = path.join(process.cwd(), 'public', 'data', 'opml', fileId.replace('.json', '.opml'));
      if (fs.existsSync(opmlFilePath)) {
        console.log(`删除OPML文件: ${opmlFilePath}`);
        fs.unlinkSync(opmlFilePath);
      }
      
      console.log('文件删除成功');
      return NextResponse.json({ 
        success: true, 
        message: '文件删除成功'
      });
    } catch (deleteError) {
      console.error('删除文件失败:', deleteError);
      return NextResponse.json(
        { error: true, message: '删除文件失败', details: (deleteError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('处理删除请求失败:', error);
    return NextResponse.json(
      { error: true, message: '删除文件失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 