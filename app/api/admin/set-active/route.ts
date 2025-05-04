import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 更新活跃文件配置
async function updateActiveFile(fileId: string) {
  try {
    console.log(`尝试设置活跃文件: ${fileId}`);
    
    // 更新mindmap-files.json配置
    const configPath = path.join(process.cwd(), 'public', 'data', 'mindmap-files.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('配置文件不存在');
      return false;
    }
    
    try {
      // 读取当前配置
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // 检查文件是否在列表中
      const fileExists = config.files.some((file: any) => file.id === fileId);
      if (!fileExists) {
        console.error(`文件ID ${fileId} 不在配置列表中`);
        return false;
      }
      
      // 更新活跃文件ID
      config.activeFileId = fileId;
      config.lastUpdated = new Date().toISOString();
      
      // 写入更新后的配置
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('mindmap-files.json配置更新成功');
      
      // 同时更新active-mindmap.json配置
      const activePath = path.join(process.cwd(), 'public', 'data', 'active-mindmap.json');
      fs.writeFileSync(activePath, JSON.stringify({
        activePath: `/data/${fileId}`,
        lastUpdated: new Date().toISOString()
      }, null, 2), 'utf-8');
      console.log('active-mindmap.json配置更新成功');
      
      return true;
    } catch (error) {
      console.error('读取或写入配置文件失败:', error);
      return false;
    }
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
    
    return NextResponse.json({ 
      success: true, 
      message: '活跃文件已更新',
      fileId: fileId
    });
  } catch (error) {
    console.error('设置活跃文件失败:', error);
    return NextResponse.json(
      { error: '设置活跃文件失败', message: (error as Error).message },
      { status: 500 }
    );
  }
} 