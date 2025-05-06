import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js'; // 导入xml2js库解析OPML文件

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

// 检测文件格式（JSON或OPML/XML）
function detectFileFormat(content: string): 'json' | 'xml' | 'unknown' {
  // 移除开头的空白字符
  const trimmed = content.trim();
  
  // 检查是否以XML声明或标签开头
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<opml') || trimmed.startsWith('<outline')) {
    return 'xml';
  }
  
  // 检查是否以JSON对象或数组开头
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  
  return 'unknown';
}

// 将OPML格式转换为Mind-Elixir格式
async function convertOpmlToMindElixir(xmlContent: string): Promise<any> {
  try {
    // 解析XML内容
    const result = await parseStringPromise(xmlContent, { 
      explicitArray: false,
      trim: true,
      normalize: true
    });
    
    console.log('OPML解析结果结构:', JSON.stringify(result).substring(0, 200) + '...');
    
    // 检查是否是有效的OPML格式
    if (!result.opml || !result.opml.body || !result.opml.body.outline) {
      console.warn('无效的OPML格式:', result);
      return DEFAULT_MINDMAP_DATA;
    }
    
    // 获取根节点
    const rootOutline = Array.isArray(result.opml.body.outline) 
      ? result.opml.body.outline[0] 
      : result.opml.body.outline;
    
    // 记录ID递增
    let idCounter = 0;
    
    // 递归将OPML转为Mind-Elixir格式
    function convertNode(node: any, index: number = 0, path: string = ''): any {
      if (!node) return null;
      
      // 生成唯一ID
      idCounter++;
      // 避免在ID中使用可能导致JSON解析问题的特殊字符
      const nodeId = `node-${path}-${idCounter}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      
      // 提取标题（增强版 - 处理MuBu格式）
      let topic = '';
      
      // MuBu格式特殊处理 - 先检查$属性
      if (node.$ && node.$.text) {
        topic = String(node.$.text);
      } 
      // 处理MuBu特有的_mubu_text属性（URL编码的HTML）
      else if (node._mubu_text) {
        try {
          // 解码URL编码
          const decoded = decodeURIComponent(node._mubu_text);
          // 移除HTML标签
          topic = decoded.replace(/<\/?[^>]+(>|$)/g, "");
        } catch (e) {
          console.warn('解码_mubu_text失败:', e);
          topic = String(node._mubu_text).substr(0, 30) + '...';
        }
      }
      // 然后检查直接text属性
      else if (node.text) {
        topic = String(node.text);
      }
      // 其他可能的属性
      else if (node._text) {
        topic = String(node._text);
      } else if (node.title) {
        topic = String(node.title);
      } else if (node._title) {
        topic = String(node._title); 
      } else {
        topic = '未命名节点';
      }
      
      // 安全处理文本内容，移除可能导致JSON格式问题的字符
      topic = String(topic)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // 处理可能破坏JSON格式的字符
        .replace(/\\/g, '\\\\')  // 转义反斜杠
        .replace(/"/g, '\\"')    // 转义双引号
        .replace(/\n/g, '\\n')   // 转义换行符
        .replace(/\r/g, '\\r')   // 转义回车符
        .replace(/\t/g, '\\t')   // 转义制表符
        .replace(/\f/g, '\\f')   // 转义换页符
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // 移除控制字符
      
      // 创建节点 - 确保所有值都是正确的数据类型
      const mindNode: any = {
        id: nodeId,
        topic: topic,
        expanded: true
      };
      
      // 处理子节点
      if (node.outline) {
        const childNodes = Array.isArray(node.outline) ? node.outline : [node.outline];
        mindNode.children = childNodes
          .filter((child: any) => child) // 过滤空值
          .map((child: any, idx: number) => 
            convertNode(child, idx, `${path}-${idx}`)
          )
          .filter(Boolean); // 过滤null结果
      } else {
        // 确保children属性始终存在，即使是空数组
        mindNode.children = [];
      }
      
      return mindNode;
    }
    
    // 创建根节点
    const rootNode = convertNode(rootOutline, 0, 'root');
    
    // 确保根节点有ID和topic
    if (!rootNode.id) {
      rootNode.id = 'root';
    }
    
    if (!rootNode.topic || rootNode.topic === '') {
      // 尝试从OPML标题获取根节点标题
      const title = result.opml.head?.title || '思维导图';
      // 安全处理标题文本
      rootNode.topic = String(title)
        .replace(/\\/g, '\\\\')  // 转义反斜杠
        .replace(/"/g, '\\"')    // 转义双引号
        .replace(/\n/g, '\\n')   // 转义换行符
        .replace(/\r/g, '\\r')   // 转义回车符
        .replace(/\t/g, '\\t');  // 转义制表符
    }
    
    // 确保expanded字段是布尔值
    rootNode.expanded = rootNode.expanded === true || rootNode.expanded === 'true' ? true : false;
    
    // 确保children字段是数组
    if (!Array.isArray(rootNode.children)) {
      rootNode.children = [];
    }
    
    // 创建安全的结果对象
    const result_data = {
      nodeData: {
        id: rootNode.id,
        topic: rootNode.topic,
        expanded: Boolean(rootNode.expanded),
        children: Array.isArray(rootNode.children) ? rootNode.children : []
      }
    };
    
    // 记录一些节点示例以便调试
    if (result_data.nodeData.children && result_data.nodeData.children.length > 0) {
      try {
        console.log('示例子节点:', JSON.stringify({
          firstChildId: result_data.nodeData.children[0].id,
          firstChildTopic: result_data.nodeData.children[0].topic,
          childrenCount: result_data.nodeData.children.length
        }));
      } catch (jsonError) {
        console.warn('示例子节点JSON序列化失败:', jsonError);
      }
    }
    
    // 额外的验证检查
    if (!result_data.nodeData || !result_data.nodeData.id || !result_data.nodeData.topic) {
      console.error('转换结果无效，缺少必要字段');
      return DEFAULT_MINDMAP_DATA;
    }
    
    // 最终安全检查：尝试序列化和反序列化以验证JSON格式
    try {
      const jsonString = JSON.stringify(result_data);
      JSON.parse(jsonString); // 如果这里抛出错误，说明JSON格式有问题
      console.log('OPML转换完成，结果通过JSON验证');
    } catch (jsonError) {
      console.error('结果JSON格式无效，返回默认数据:', jsonError);
      return DEFAULT_MINDMAP_DATA;
    }
    
    return result_data;
  } catch (error) {
    console.error('转换OPML文件失败:', error);
    return DEFAULT_MINDMAP_DATA;
  }
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
    
    // 读取文件内容
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      console.log('文件内容读取成功');
      
      // 检测文件格式
      const fileFormat = detectFileFormat(fileContent);
      console.log('检测到文件格式:', fileFormat);
      
      let formattedData;
      
      if (fileFormat === 'json') {
        // 处理JSON格式
        try {
          const mindmapData = JSON.parse(fileContent);
          console.log('JSON解析成功');
          formattedData = convertToMindElixirFormat(mindmapData);
        } catch (jsonError) {
          console.error('JSON解析失败:', jsonError);
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
      } else if (fileFormat === 'xml') {
        // 处理OPML/XML格式
        try {
          console.log('开始解析OPML/XML文件');
          formattedData = await convertOpmlToMindElixir(fileContent);
          console.log('OPML转换完成', formattedData);
        } catch (xmlError) {
          console.error('XML解析失败:', xmlError);
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
      } else {
        // 未知格式
        console.error('未知文件格式');
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
      
      console.log('数据格式转换完成，进行最终验证');
      
      // 最终安全检查 - 确保返回有效的JSON
      try {
        // 先验证数据结构
        if (!formattedData || typeof formattedData !== 'object') {
          console.warn('数据不是有效对象，使用默认数据');
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
        
        // 验证nodeData结构
        if (!formattedData.nodeData || typeof formattedData.nodeData !== 'object') {
          console.warn('数据缺少nodeData结构，使用默认数据');
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
        
        // 确保关键字段存在
        if (!formattedData.nodeData.id || !formattedData.nodeData.topic) {
          console.warn('nodeData缺少必须的id或topic字段，使用默认数据');
          return NextResponse.json(DEFAULT_MINDMAP_DATA);
        }
        
        // 尝试序列化和解析，检查JSON格式是否有效
        const jsonString = JSON.stringify(formattedData);
        JSON.parse(jsonString);
        
        console.log('数据验证通过，返回结果');
        return NextResponse.json(formattedData);
      } catch (jsonError) {
        console.error('最终JSON验证失败，返回默认数据:', jsonError);
        return NextResponse.json(DEFAULT_MINDMAP_DATA);
      }
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