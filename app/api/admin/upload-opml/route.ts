import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';

// 定义MindElixir节点类型
interface MindElixirNode {
  topic: string;
  children?: MindElixirNode[];
}

// 文件信息结构
interface FileInfo {
  id: string;
  name: string;
  uploadDate: string;
  nodesCount?: number;
  path?: string;
}

// 文件列表配置
interface FileListConfig {
  files: FileInfo[];
  activeFileId: string;
  lastUpdated: string;
}

// 将OPML内容转换为Mind-Elixir格式
async function convertOpmlToMindElixir(opmlContent: string): Promise<MindElixirNode> {
  try {
    // 解析OPML XML
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(opmlContent);
    
    if (!result || !result.opml || !result.opml.body || !result.opml.body.outline) {
      throw new Error('OPML格式无效');
    }
    
    // OPML的根节点
    const rootOutline = Array.isArray(result.opml.body.outline) 
      ? result.opml.body.outline[0] 
      : result.opml.body.outline;
    
    // 递归将OPML的outline转换为Mind-Elixir的节点结构
    function convertOutlineToNode(outline: any): MindElixirNode | null {
      if (!outline) return null;
      
      const node: MindElixirNode = {
        topic: outline.$.text || outline.$._text || '未命名节点',
      };
      
      // 处理子节点
      if (outline.outline) {
        node.children = [];
        const children = Array.isArray(outline.outline) ? outline.outline : [outline.outline];
        
        children.forEach((child: any) => {
          const childNode = convertOutlineToNode(child);
          if (childNode) {
            node.children!.push(childNode);
          }
        });
      }
      
      return node;
    }
    
    // 创建Mind-Elixir格式的数据
    const mindElixirData: MindElixirNode = {
      // 使用OPML的根节点文本作为根节点
      topic: rootOutline.$.text || rootOutline.$._text || '思维导图',
      children: []
    };
    
    // 转换根节点的子节点
    if (rootOutline.outline) {
      const children = Array.isArray(rootOutline.outline) ? rootOutline.outline : [rootOutline.outline];
      children.forEach((child: any) => {
        const childNode = convertOutlineToNode(child);
        if (childNode) {
          mindElixirData.children!.push(childNode);
        }
      });
    }
    
    return mindElixirData;
  } catch (error) {
    console.error('转换OPML文件失败:', error);
    throw new Error(`转换OPML失败: ${(error as Error).message}`);
  }
}

// 计算节点总数
function countNodes(node: MindElixirNode): number {
  let count = 1; // 当前节点
  
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  
  return count;
}

// 更新文件列表配置
async function updateFileListConfig(fileInfo: FileInfo, makeActive: boolean = false) {
  // 配置文件路径
  const configPath = path.join(process.cwd(), 'public', 'data', 'mindmap-files.json');
  
  let config: FileListConfig;
  
  // 尝试读取现有配置
  try {
    if (fs.existsSync(configPath)) {
      const configData = await readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } else {
      // 创建新配置
      config = {
        files: [],
        activeFileId: '',
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('读取配置文件失败，创建新配置:', err);
    config = {
      files: [],
      activeFileId: '',
      lastUpdated: new Date().toISOString()
    };
  }
  
  // 添加新文件信息
  config.files = config.files.filter(file => file.id !== fileInfo.id); // 移除相同ID的文件
  config.files.push(fileInfo); // 添加新文件
  
  // 如果需要设置为活跃文件，或者这是第一个文件
  if (makeActive || config.files.length === 1) {
    config.activeFileId = fileInfo.id;
    
    // 同时更新active-mindmap.json
    const activePath = path.join(process.cwd(), 'public', 'data', 'active-mindmap.json');
    await writeFile(activePath, JSON.stringify({
      activePath: `/data/${fileInfo.id}`,
      lastUpdated: new Date().toISOString()
    }, null, 2), 'utf8');
  }
  
  config.lastUpdated = new Date().toISOString();
  
  // 保存配置
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  
  return config;
}

export async function POST(request: NextRequest) {
  try {
    console.log('开始处理OPML上传请求');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // 检查文件是否存在
    if (!file) {
      console.error('未找到上传的文件');
      return NextResponse.json(
        { error: true, message: '未找到上传的文件' },
        { status: 400 }
      );
    }
    
    console.log(`接收到文件: ${file.name}, 大小: ${file.size} 字节`);
    
    // 检查文件类型
    if (!file.name.endsWith('.opml')) {
      console.error(`文件类型不支持: ${file.name}`);
      return NextResponse.json(
        { error: true, message: '只支持OPML格式文件' },
        { status: 400 }
      );
    }
    
    // 检查文件大小（最大10MB）
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      console.error(`文件过大: ${file.size} 字节`);
      return NextResponse.json(
        { error: true, message: '文件大小不能超过10MB' },
        { status: 400 }
      );
    }
    
    // 获取当前时间戳作为文件名前缀
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const opmlFileName = `${timestamp}-${file.name}`;
    const jsonFileName = opmlFileName.replace('.opml', '.json');
    
    // 确保目录存在
    const publicDataDir = path.join(process.cwd(), 'public', 'data');
    const opmlDir = path.join(publicDataDir, 'opml');
    
    try {
      // 创建目录
      if (!fs.existsSync(publicDataDir)) {
        console.log(`创建目录: ${publicDataDir}`);
        await mkdir(publicDataDir, { recursive: true });
      }
      
      if (!fs.existsSync(opmlDir)) {
        console.log(`创建目录: ${opmlDir}`);
        await mkdir(opmlDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('创建目录失败:', dirError);
      return NextResponse.json(
        { error: true, message: '服务器存储目录创建失败', details: (dirError as Error).message },
        { status: 500 }
      );
    }
    
    try {
      // 保存原始OPML文件
      const opmlPath = path.join(opmlDir, opmlFileName);
      console.log(`保存OPML文件到: ${opmlPath}`);
      const opmlBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(opmlPath, opmlBuffer);
      console.log('OPML文件保存成功');
      
      // 将OPML转换为Mind-Elixir格式
      console.log('开始转换OPML为Mind-Elixir格式');
      const opmlContent = opmlBuffer.toString('utf-8');
      const mindElixirData = await convertOpmlToMindElixir(opmlContent);
      console.log('OPML转换成功');
      
      // 计算节点数量
      const nodesCount = countNodes(mindElixirData);
      console.log(`思维导图共有 ${nodesCount} 个节点`);
      
      // 保存转换后的JSON文件
      const jsonPath = path.join(publicDataDir, jsonFileName);
      console.log(`保存JSON文件到: ${jsonPath}`);
      await writeFile(jsonPath, JSON.stringify(mindElixirData, null, 2), 'utf-8');
      console.log('JSON文件保存成功');
      
      // 创建文件信息
      const fileInfo: FileInfo = {
        id: jsonFileName,
        name: file.name.replace('.opml', ''),
        uploadDate: new Date().toISOString(),
        nodesCount: nodesCount,
        path: `/data/${jsonFileName}`
      };
      
      // 更新文件列表配置
      await updateFileListConfig(fileInfo, true);
      console.log('文件信息已添加到配置');
      
      return NextResponse.json({
        success: true,
        message: '文件上传并转换成功',
        file: fileInfo
      });
    } catch (fileError) {
      console.error('文件操作失败:', fileError);
      return NextResponse.json(
        { error: true, message: '文件保存或转换失败', details: (fileError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('上传处理过程中出错:', error);
    return NextResponse.json(
      { error: true, message: '上传文件失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 