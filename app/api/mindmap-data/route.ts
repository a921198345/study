import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 检查是否有active-mindmap.json配置文件
    const configPath = path.join(process.cwd(), 'public', 'data', 'active-mindmap.json');
    let activeMindmapPath;
    
    if (fs.existsSync(configPath)) {
      // 读取配置文件获取活跃思维导图路径
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      activeMindmapPath = configData.activePath;
    } else {
      // 默认使用simple-mindmap.json
      activeMindmapPath = '/data/simple-mindmap.json';
    }
    
    // 构建文件的完整路径
    const fullPath = path.join(process.cwd(), 'public', activeMindmapPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      console.error('思维导图文件不存在:', fullPath);
      return NextResponse.json(
        { error: '思维导图文件不存在' },
        { status: 404 }
      );
    }
    
    // 读取JSON文件内容
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const mindmapData = JSON.parse(fileContent);
    
    // 返回思维导图数据
    return NextResponse.json(mindmapData);
  } catch (error) {
    console.error('获取思维导图数据失败:', error);
    return NextResponse.json(
      { error: '加载思维导图数据失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 