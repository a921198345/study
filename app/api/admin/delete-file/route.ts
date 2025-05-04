import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 从配置获取当前活跃文件ID
function getActiveFileIdFromConfig(): string {
  try {
    console.log('获取当前活跃文件');
    const configPath = path.join(process.cwd(), 'public', 'data', 'mindmap-files.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('配置文件不存在');
      return '';
    }
    
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    console.log(`当前活跃文件ID: ${config.activeFileId || '无'}`);
    return config.activeFileId || '';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return '';
  }
}

// 从配置文件中删除文件信息
async function removeFileFromConfig(fileId: string): Promise<boolean> {
  try {
    console.log(`从配置中删除文件: ${fileId}`);
    const configPath = path.join(process.cwd(), 'public', 'data', 'mindmap-files.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('配置文件不存在');
      return false;
    }
    
    // 读取当前配置
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // 移除指定文件
    config.files = config.files.filter((file: any) => file.id !== fileId);
    config.lastUpdated = new Date().toISOString();
    
    // 写入更新后的配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('配置文件更新成功');
    
    return true;
  } catch (error) {
    console.error('更新配置文件失败:', error);
    return false;
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
    const activeFileId = getActiveFileIdFromConfig();
    if (fileId === activeFileId) {
      console.error('尝试删除活跃文件');
      return NextResponse.json(
        { error: true, message: '不能删除当前活跃文件，请先设置其他文件为活跃文件' },
        { status: 400 }
      );
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
      // 从配置中删除文件信息
      const configUpdated = await removeFileFromConfig(fileId);
      if (!configUpdated) {
        console.error('从配置中删除文件失败');
        return NextResponse.json(
          { error: true, message: '更新配置文件失败' },
          { status: 500 }
        );
      }
      
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
        message: '文件删除成功',
        fileId: fileId
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