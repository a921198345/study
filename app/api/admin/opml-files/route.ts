import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 从配置文件读取文件列表
function getFileListFromConfig(): any {
  try {
    const configPath = path.join(process.cwd(), 'public', 'data', 'mindmap-files.json');
    
    // 检查配置文件是否存在
    if (!fs.existsSync(configPath)) {
      console.log('配置文件不存在，返回空列表');
      return { files: [], activeFileId: '' };
    }

    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    return config;
  } catch (error) {
    console.error('读取配置文件失败:', error);
    return { files: [], activeFileId: '' };
  }
}

// 获取默认文件列表（用于配置丢失或其他特殊情况）
function getDefaultFiles() {
  return [
    {
      id: 'simple-mindmap.json',
      name: 'simple-mindmap',
      uploadDate: '2023-10-13T01:46:40.000Z',
      nodesCount: 15,
      isActive: true
    },
    {
      id: '2025-04-28T11-12-33-489Z-__.json',
      name: '2025-04-28T11-12-33-489Z-__',
      uploadDate: '2023-10-13T01:48:40.000Z',
      nodesCount: 21,
      isActive: false
    }
  ];
}

export async function GET() {
  console.log('获取思维导图文件列表');
  
  try {
    // 从配置文件获取文件列表
    const { files, activeFileId } = getFileListFromConfig();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log('配置中未找到文件，返回默认文件列表');
      const defaultFiles = getDefaultFiles();
      return NextResponse.json({ 
        files: defaultFiles,
        message: '使用默认文件列表 - 未找到已上传文件'
      });
    }
    
    // 添加isActive标记到每个文件
    const filesWithActiveFlag = files.map(file => ({
      ...file,
      isActive: file.id === activeFileId
    }));
    
    // 按上传日期降序排序
    filesWithActiveFlag.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    
    console.log(`找到 ${filesWithActiveFlag.length} 个文件`);
    return NextResponse.json({ files: filesWithActiveFlag });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    // 发生错误时返回默认文件列表
    return NextResponse.json({ 
      files: getDefaultFiles(),
      error: '获取文件列表失败，显示默认文件',
      details: (error as Error).message
    });
  }
} 