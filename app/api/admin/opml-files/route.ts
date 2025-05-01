import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取当前活跃文件
function getActiveFile(): string {
  try {
    const configPath = path.join(process.cwd(), 'config', 'mindmap.json');
    
    // 检查配置文件是否存在
    if (!fs.existsSync(configPath)) {
      // 如果不存在，创建默认配置
      if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify({ activeFile: '' }, null, 2));
      return '';
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.activeFile || '';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return '';
  }
}

// 计算JSON文件中节点数量
function getNodeCount(filePath: string): number {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      return 0;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // 递归计算节点数量
    const countNodes = (node: any): number => {
      if (!node) return 0;
      
      let count = 1; // 当前节点
      
      // 计算子节点
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          count += countNodes(child);
        });
      }
      
      return count;
    };
    
    return countNodes(data);
  } catch (error) {
    console.error(`计算文件 ${filePath} 节点数量失败:`, error);
    return 0;
  }
}

// 如果是Vercel环境，默认提供一些示例文件
function getDefaultFiles() {
  return [
    {
      id: 'simple-mindmap.json',
      name: 'simple-mindmap',
      uploadDate: '2018-10-20T01:46:40.000Z',
      nodeCount: 1,
      isActive: true
    },
    {
      id: '2025-04-28T11-12-33-489Z-__.json',
      name: '2025-04-28T11-12-33-489Z-__',
      uploadDate: '2018-10-20T01:46:40.000Z',
      nodeCount: 1,
      isActive: false
    }
  ];
}

export async function GET() {
  console.log('获取OPML文件列表');
  
  let dataDir;
  
  // 在Vercel环境中无法动态写入文件，所以返回默认文件列表
  if (process.env.VERCEL) {
    console.log('在Vercel环境中，返回默认文件列表');
    return NextResponse.json({ files: getDefaultFiles() });
  } else {
    dataDir = path.join(process.cwd(), 'public', 'data');
  }
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    console.log(`创建数据目录: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
    return NextResponse.json({ files: [] });
  }
  
  const activeFile = getActiveFile();
  console.log(`当前活跃文件: ${activeFile}`);
  
  try {
    // 读取目录下的所有JSON文件（排除测试文件）
    console.log(`从目录 ${dataDir} 读取文件`);
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json') && !file.startsWith('test-'))
      .map(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        
        const id = file;
        const name = file.replace('.json', '');
        const uploadDate = stats.mtime.toISOString();
        const nodeCount = getNodeCount(filePath);
        const isActive = id === activeFile;
        
        return {
          id,
          name,
          uploadDate,
          nodeCount,
          isActive
        };
      });
    
    // 按上传日期降序排序
    files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    
    console.log(`找到 ${files.length} 个文件`);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    // 发生错误时，也返回默认文件列表
    return NextResponse.json({ 
      files: getDefaultFiles(),
      error: '获取文件列表失败，显示默认文件'
    });
  }
} 