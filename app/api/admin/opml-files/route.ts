import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取当前活跃文件
function getActiveFile(): string {
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

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.activeFile || '';
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return '';
  }
}

// 计算OPML文件中节点数量
function getNodeCount(filePath: string): number {
  try {
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

export async function GET() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    return NextResponse.json({ files: [] });
  }
  
  const activeFile = getActiveFile();
  
  try {
    // 读取目录下的所有JSON文件（排除测试文件）
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
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return NextResponse.json(
      { error: '获取文件列表失败' },
      { status: 500 }
    );
  }
} 