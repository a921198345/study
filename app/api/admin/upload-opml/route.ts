import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';

// 定义MindElixir节点类型
interface MindElixirNode {
  topic: string;
  children?: MindElixirNode[];
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // 检查文件是否存在
    if (!file) {
      return NextResponse.json(
        { error: true, message: '未找到上传的文件' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    if (!file.name.endsWith('.opml')) {
      return NextResponse.json(
        { error: true, message: '只支持OPML格式文件' },
        { status: 400 }
      );
    }
    
    // 检查文件大小（最大10MB）
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
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
    const opmlDir = path.join(process.cwd(), 'public', 'data', 'opml');
    const dataDir = path.join(process.cwd(), 'public', 'data');
    
    if (!fs.existsSync(opmlDir)) {
      await mkdir(opmlDir, { recursive: true });
    }
    
    if (!fs.existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }
    
    // 保存原始OPML文件
    const opmlPath = path.join(opmlDir, opmlFileName);
    const opmlBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(opmlPath, opmlBuffer);
    
    // 将OPML转换为Mind-Elixir格式
    const opmlContent = opmlBuffer.toString('utf-8');
    const mindElixirData = await convertOpmlToMindElixir(opmlContent);
    
    // 保存转换后的JSON文件
    const jsonPath = path.join(dataDir, jsonFileName);
    await writeFile(jsonPath, JSON.stringify(mindElixirData, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: '文件上传并转换成功',
      file: {
        id: jsonFileName,
        name: file.name.replace('.opml', ''),
        uploadDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json(
      { error: true, message: '上传文件失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 