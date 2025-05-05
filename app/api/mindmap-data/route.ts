import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 默认思维导图数据，当文件不存在时返回
const DEFAULT_MINDMAP_DATA = {
  id: "root",
  topic: "默认思维导图",
  expanded: true,
  children: [
    {
      id: "default-1",
      topic: "请上传思维导图数据",
      expanded: true
    }
  ]
};

// 验证思维导图数据是否有效
function validateMindMapData(data: any): boolean {
  // 检查必要字段
  if (!data || typeof data !== 'object') return false;
  if (!data.id || !data.topic || typeof data.topic !== 'string') return false;
  
  // 检查expanded字段
  if (data.expanded !== undefined && typeof data.expanded !== 'boolean') return false;
  
  // 递归验证子节点
  if (data.children) {
    if (!Array.isArray(data.children)) return false;
    for (const child of data.children) {
      if (!validateMindMapData(child)) return false;
    }
  }
  
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // 提取查询参数，支持直接查询特定文件
    const url = new URL(request.url);
    const fileParam = url.searchParams.get('file');
    
    let activeMindmapPath = '';
    
    if (fileParam) {
      // 如果提供了文件参数，直接使用
      activeMindmapPath = `/data/${fileParam}`;
    } else {
      // 否则查找活跃文件
      // 检查是否有active-mindmap.json配置文件
      const configPath = path.join(process.cwd(), 'public', 'data', 'active-mindmap.json');
      
      if (fs.existsSync(configPath)) {
        try {
          // 读取配置文件获取活跃思维导图路径
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          activeMindmapPath = configData.activePath;
        } catch (configError) {
          console.error('读取配置文件失败:', configError);
          // 配置文件读取失败，使用默认路径
          activeMindmapPath = '/data/simple-mindmap.json';
        }
      } else {
        // 默认使用simple-mindmap.json
        activeMindmapPath = '/data/simple-mindmap.json';
      }
    }
    
    // 构建文件的完整路径
    const fullPath = path.join(process.cwd(), 'public', activeMindmapPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      console.error('思维导图文件不存在:', fullPath);
      
      // 检查默认文件是否存在
      const defaultPath = path.join(process.cwd(), 'public', '/data/simple-mindmap.json');
      if (fs.existsSync(defaultPath)) {
        // 使用默认文件
        const defaultContent = fs.readFileSync(defaultPath, 'utf8');
        try {
          const defaultData = JSON.parse(defaultContent);
          // 验证数据格式
          if (validateMindMapData(defaultData)) {
            return NextResponse.json(defaultData);
          } else {
            console.warn('默认思维导图数据格式无效，使用内置数据');
            return NextResponse.json(DEFAULT_MINDMAP_DATA);
          }
        } catch (parseError) {
          console.error('解析默认文件失败:', parseError);
          // 返回默认数据结构
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
      } else {
        // 返回内置默认数据
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
    }
    
    // 读取JSON文件内容
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const mindmapData = JSON.parse(fileContent);
      
      // 验证数据格式
      if (validateMindMapData(mindmapData)) {
        // 返回思维导图数据
        return NextResponse.json(mindmapData);
      } else {
        console.warn('思维导图数据格式无效，使用默认数据');
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
    } catch (fileError) {
      console.error('读取或解析思维导图文件失败:', fileError);
      // 文件读取或解析失败，返回默认数据
      return NextResponse.json(DEFAULT_MINDMAP_DATA);
    }
  } catch (error) {
    console.error('获取思维导图数据失败:', error);
    // 发生任何错误，返回默认数据
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  }
} 