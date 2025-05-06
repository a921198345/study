import { NextRequest, NextResponse } from 'next/server';
import xml2js from 'xml2js';
import { supabaseAdmin } from '@/lib/supabase';

// 定义MindElixir节点类型
interface MindElixirNode {
  topic: string;
  id?: string;
  expanded?: boolean;
  children?: MindElixirNode[];
}

// 文件信息结构
interface FileInfo {
  id: string;
  name: string;
  uploadDate: string;
  nodesCount?: number;
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
        expanded: true,
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
      expanded: true,
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

// 更新Supabase中的活跃思维导图
async function setActiveFile(fileId: string) {
  try {
    // 先将所有mindmap设置为非活跃
    await supabaseAdmin
      .from('mindmaps')
      .update({ is_active: false })
      .neq('id', 'placeholder');
    
    // 设置新的活跃文件
    await supabaseAdmin
      .from('mindmaps')
      .update({ is_active: true })
      .eq('id', fileId);
    
    return true;
  } catch (error) {
    console.error('设置活跃文件失败:', error);
    throw error;
  }
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
    
    // 获取文件内容
    const opmlBuffer = Buffer.from(await file.arrayBuffer());
    const opmlContent = opmlBuffer.toString('utf-8');
    
    try {
      // 将OPML转换为Mind-Elixir格式
      console.log('开始转换OPML为Mind-Elixir格式');
      const mindElixirData = await convertOpmlToMindElixir(opmlContent);
      console.log('OPML转换成功');
      
      // 计算节点数量
      const nodesCount = countNodes(mindElixirData);
      console.log(`思维导图共有 ${nodesCount} 个节点`);
      
      // 包装为API返回格式
      const mindElixirJsonData = {
        nodeData: {
          id: "root",
          topic: mindElixirData.topic,
          expanded: true,
          children: mindElixirData.children || []
        }
      };
      
      // 生成文件唯一ID
      const timestamp = new Date().toISOString();
      const fileId = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
      
      // 存储到Supabase
      const { data, error } = await supabaseAdmin.from('mindmaps').insert({
        id: fileId,
        file_name: file.name,
        opml_content: opmlContent,
        json_content: mindElixirJsonData,
        nodes_count: nodesCount,
        is_active: false,
        created_at: timestamp
      }).select().single();
      
      if (error) {
        console.error('保存到Supabase失败:', error);
        return NextResponse.json(
          { error: true, message: '存储思维导图数据失败', details: error.message },
          { status: 500 }
        );
      }
      
      // 创建文件信息
      const fileInfo: FileInfo = {
        id: fileId,
        name: file.name,
        uploadDate: timestamp,
        nodesCount
      };
      
      // 设置为活跃文件
      const makeActive = formData.get('makeActive') === 'true';
      if (makeActive) {
        await setActiveFile(fileId);
      }
      
      // 返回成功信息
      return NextResponse.json({
        success: true,
        message: '文件上传并转换成功',
        fileInfo,
        makeActive
      });
      
    } catch (conversionError) {
      console.error('处理OPML文件失败:', conversionError);
      return NextResponse.json(
        { 
          error: true, 
          message: '文件保存或转换失败', 
          details: (conversionError as Error).message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('上传请求处理失败:', error);
    return NextResponse.json(
      { error: true, message: '处理请求失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 