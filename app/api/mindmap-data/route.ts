import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 默认思维导图数据，当文件不存在时返回 - 修改为与MindElixir兼容的格式
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
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
  }
};

// 验证思维导图数据是否有效
function validateMindMapData(data: any): boolean {
  // 检查数据是否存在
  if (!data || typeof data !== 'object') {
    console.warn('无效数据: 不是对象', data);
    return false;
  }
  
  // 处理nodeData包装情况
  if (data.nodeData && typeof data.nodeData === 'object') {
    return validateMindMapData(data.nodeData); // 递归验证nodeData内部的数据
  }
  
  // 检查必要字段
  if (!data.id || !data.topic || typeof data.topic !== 'string') {
    console.warn('无效数据: 缺少id或topic', data);
    return false;
  }
  
  // 检查expanded字段
  if (data.expanded !== undefined && typeof data.expanded !== 'boolean') {
    console.warn('无效数据: expanded字段类型错误', data);
    return false;
  }
  
  // 递归验证子节点
  if (data.children) {
    if (!Array.isArray(data.children)) {
      console.warn('无效数据: children不是数组', data);
      return false;
    }
    
    for (const child of data.children) {
      if (!validateMindMapData(child)) {
        return false;
      }
    }
  }
  
  return true;
}

// 转换数据为MindElixir兼容格式
function convertToMindElixirFormat(data: any): any {
  // 确保数据存在
  if (!data) {
    console.warn('转换失败: 无数据');
    return DEFAULT_MINDMAP_DATA;
  }
  
  try {
    // 如果数据已经是MindElixir格式(有nodeData字段)，确保nodeData结构正确
    if (data.nodeData && typeof data.nodeData === 'object') {
      // 确保nodeData内部结构有效
      if (validateMindMapData(data.nodeData)) {
        return data;
      } else {
        console.warn('转换失败: nodeData结构无效');
        return DEFAULT_MINDMAP_DATA;
      }
    }
    
    // 如果数据是单节点格式(有id和topic)
    if (data.id && data.topic) {
      return {
        nodeData: data
      };
    }
    
    // 不支持的格式，返回默认数据
    console.warn('转换失败: 未知数据结构', data);
    return DEFAULT_MINDMAP_DATA;
  } catch (error) {
    console.error('转换数据时出错:', error);
    return DEFAULT_MINDMAP_DATA;
  }
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
          console.log('找到活跃思维导图路径:', activeMindmapPath);
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
    console.log('尝试读取思维导图文件:', fullPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      console.error('思维导图文件不存在:', fullPath);
      
      // 检查默认文件是否存在
      const defaultPath = path.join(process.cwd(), 'public', '/data/simple-mindmap.json');
      if (fs.existsSync(defaultPath)) {
        // 使用默认文件
        console.log('使用默认文件:', defaultPath);
        const defaultContent = fs.readFileSync(defaultPath, 'utf8');
        try {
          const defaultData = JSON.parse(defaultContent);
          console.log('默认文件解析成功');
          
          // 返回转换后的MindElixir兼容格式
          const formattedData = convertToMindElixirFormat(defaultData);
          console.log('返回格式化数据');
          return NextResponse.json(formattedData);
        } catch (parseError) {
          console.error('解析默认文件失败:', parseError);
          // 返回默认数据结构
          console.log('返回内置默认数据');
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
      } else {
        // 返回内置默认数据
        console.log('返回内置默认数据 (无默认文件)');
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
    }
    
    // 读取JSON文件内容
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      console.log('文件内容读取成功');
      
      let mindmapData;
      try {
        mindmapData = JSON.parse(fileContent);
        console.log('JSON解析成功');
      } catch (jsonError) {
        console.error('JSON解析失败:', jsonError);
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
      
      // 转换数据为MindElixir兼容格式
      const formattedData = convertToMindElixirFormat(mindmapData);
      console.log('数据格式转换完成，返回结果');
      return NextResponse.json(formattedData);
    } catch (fileError) {
      console.error('读取思维导图文件失败:', fileError);
      // 文件读取失败，返回默认数据
      return NextResponse.json(DEFAULT_MINDMAP_DATA);
    }
  } catch (error) {
    console.error('获取思维导图数据失败:', error);
    // 发生任何错误，返回默认数据
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  }
} 