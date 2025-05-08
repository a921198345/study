import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js'; // 导入xml2js库解析OPML文件
import { supabaseAdmin, supabase } from '@/lib/supabase';
import xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';

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
    console.warn('validateMindMapData: 无效数据: 不是对象', typeof data);
    return false;
  }
  
  // 处理nodeData包装情况
  if (data.nodeData && typeof data.nodeData === 'object') {
    console.log('validateMindMapData: 检测到nodeData包装，递归验证内部数据');
    return validateMindMapData(data.nodeData); // 递归验证nodeData内部的数据
  }
  
  // 更宽松的ID验证 - 如果没有ID但有topic，可以考虑自动生成ID并通过验证
  let missingId = false;
  if (!data.id) {
    console.warn('validateMindMapData: 节点缺少ID，标题=', data.topic?.substring(0, 30));
    missingId = true;
    // 我们不立即返回false，稍后处理
  }
  
  // 检查topic字段
  if (!data.topic || typeof data.topic !== 'string') {
    console.warn('validateMindMapData: 无效数据: 缺少topic或不是字符串类型', data);
    return false;
  }
  
  // 如果缺少ID但有topic，我们可以在后续步骤中自动生成ID，所以这里不立即失败
  if (missingId) {
    console.log('validateMindMapData: 节点缺少ID但有有效topic，验证子节点:', data.topic?.substring(0, 30));
  }
  
  // 检查expanded字段
  if (data.expanded !== undefined && typeof data.expanded !== 'boolean') {
    console.warn('validateMindMapData: expanded字段类型错误，应为布尔值，实际为:', typeof data.expanded);
    // 我们可以自动修复，所以不立即返回false
  }
  
  // 递归验证子节点
  if (data.children) {
    if (!Array.isArray(data.children)) {
      console.warn('validateMindMapData: children不是数组', typeof data.children);
      return false;
    }
    
    let allChildrenValid = true;
    for (let i = 0; i < data.children.length; i++) {
      const child = data.children[i];
      if (!child) {
        console.warn(`validateMindMapData: 子节点[${i}]为null或undefined`);
        continue; // 跳过空子节点，但不失败
      }
      
      if (!validateMindMapData(child)) {
        console.warn(`validateMindMapData: 子节点[${i}]验证失败, topic=${child.topic?.substring(0, 30)}`);
        allChildrenValid = false;
        break;
      }
    }
    
    if (!allChildrenValid) {
      return false;
    }
  }
  
  // 如果只是缺少ID，我们认为数据基本有效，可以通过自动生成ID解决
  if (missingId) {
    console.log('validateMindMapData: 节点及子节点验证通过，但缺少ID，可以通过自动生成ID解决');
    return true; // 允许缺少ID的节点通过验证
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

// 预处理和修复JSON格式问题
function sanitizeJsonString(jsonStr: string): string {
  if (!jsonStr || typeof jsonStr !== 'string') {
    // 返回默认思维导图的JSON字符串而不是空对象
    return JSON.stringify(DEFAULT_MINDMAP_DATA);
  }
  
  try {
    // 尝试先解析，如果正常则直接返回
    JSON.parse(jsonStr);
    return jsonStr;
  } catch (e) {
    console.log('JSON格式有问题，尝试修复', e);
    
    // 修复特定格式问题
    let fixed = jsonStr;
    
    // 记录原始错误的JSON供调试
    console.log('原始错误JSON预览:', fixed.substring(0, 200));
    
    // 1. 处理nodeData格式问题（最严重的情况）
    if (fixed.includes('"nodeData":null{')) {
      console.log('检测到严重的nodeData格式问题，尝试深度修复');
      // 替换 "nodeData":null{ 为 "nodeData":{
      fixed = fixed.replace(/"nodeData"\s*:null\s*{/g, '"nodeData":{');
    }
    
    // 2. 处理特殊情况：nulltrue, nullfalse
    fixed = fixed.replace(/null(true|false)/g, 'null,$1');
    
    // 3. 处理null后面直接跟[数组]的情况
    fixed = fixed.replace(/null(\[)/g, 'null,$1');
    
    // 4. 处理null{和null"格式问题
    fixed = fixed.replace(/null\s*{/g, 'null,{')
                 .replace(/null\s*"/g, 'null,"');
    
    // 5. 完全替换所有null加内容的模式（更全面的匹配）
    fixed = fixed.replace(/null([a-zA-Z0-9"\[{])/g, 'null,$1');
    
    // 6. 处理:null加所有内容的模式 - 避免"expanded":nulltrue这种格式
    fixed = fixed.replace(/:"null/g, '":null,"');
    fixed = fixed.replace(/:null([a-zA-Z0-9"\[{])/g, ':null,$1');
    
    // 7. 替换裸null值为null字符串
    fixed = fixed.replace(/:null([,}])/g, ':null$1');
    
    // 8. 移除多余的逗号
    fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    
    // 9. 处理连续的逗号
    fixed = fixed.replace(/,,+/g, ',');
    
    // 10. 修复缺少值的属性
    fixed = fixed.replace(/"[^"]+"\s*:/g, (match: string) => {
      if (match.endsWith(':')) {
        return match + 'null';
      }
      return match;
    });
    
    // 11. 其他常见错误修复
    fixed = fixed.replace(/}\s*{/g, '},{')  // 修复对象之间缺少逗号
                 .replace(/]\s*\[/g, '],[')  // 修复数组之间缺少逗号
                 .replace(/}\s*\[/g, '},[') // 修复对象后接数组缺少逗号
                 .replace(/]\s*{/g, '],{');  // 修复数组后接对象缺少逗号
    
    // 12. 特殊处理 - 改进错误JSON格式，更彻底的方式
    if (fixed.includes('null{') || fixed.includes('null"') || 
        fixed.includes('nulltrue') || fixed.includes('null[')) {
      console.warn('仍然检测到错误格式，尝试重构整个JSON对象');
      
      try {
        // 尝试提取基本结构并重新构建JSON
        const regex = /"nodeData"[\s\S]*?\{([\s\S]*)\}/;
        const match: RegExpExecArray | null = regex.exec(fixed);
        
        if (match && match[1]) {
          // 尝试基于提取的内容构建一个新的干净对象
          const extractedContent = match[1]
            .replace(/null([a-zA-Z0-9"\[{])/g, 'null,$1')
            .replace(/nulltrue/g, 'true')
            .replace(/nullfalse/g, 'false');
          
          // 重构的最小对象
          const newObj = {
            nodeData: {
              id: 'root',
              topic: '思维导图',
              expanded: true,
              children: []
            }
          };
          
          // 尝试从提取的内容中恢复标题
          const topicMatch: RegExpExecArray | null = /"topic"\s*:\s*(?:null)?"([^"]+)"/i.exec(extractedContent);
          if (topicMatch && topicMatch[1]) {
            newObj.nodeData.topic = topicMatch[1];
          }
          
          // 转换成JSON
          fixed = JSON.stringify(newObj);
          console.log('重构后的JSON:', fixed);
        }
      } catch (rebuildError) {
        console.error('重构JSON失败，使用默认数据', rebuildError);
        // 如果重构失败，返回默认数据
        return JSON.stringify(DEFAULT_MINDMAP_DATA);
      }
    }
    
    console.log('JSON修复完成，尝试验证，修复后预览:', fixed.substring(0, 200));
    
    // 尝试解析修复后的JSON，验证是否有效
    try {
      const parsed = JSON.parse(fixed);
      
      // 验证解析后的数据是否有基本结构
      if (!parsed.nodeData || typeof parsed.nodeData !== 'object') {
        console.warn('修复后的数据缺少nodeData结构，使用默认数据');
        return JSON.stringify(DEFAULT_MINDMAP_DATA);
      }
      
      console.log('JSON修复成功');
      return fixed;
    } catch (fixError) {
      console.error('无法修复的JSON格式问题，使用默认数据:', fixError);
      return JSON.stringify(DEFAULT_MINDMAP_DATA);
    }
  }
}

// 增强的函数，确保能处理大型OPML文件
async function fetchCompleteFileData(fileId: string) {
  try {
    // 检查 supabase 客户端是否可用
    if (!supabase && !supabaseAdmin) {
      console.error('Supabase 客户端未初始化，可能是环境变量缺失');
      console.error('NEXT_PUBLIC_SUPABASE_URL 存在:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY 存在:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.error('SUPABASE_SERVICE_KEY 存在:', !!process.env.SUPABASE_SERVICE_KEY);
      throw new Error('数据库连接失败，请检查环境配置');
    }
    
    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase;
    
    // 显式检查确保client不为null (TypeScript类型安全)
    if (!client) {
      throw new Error('无法初始化Supabase客户端');
    }
    
    console.log(`尝试从Supabase获取文件ID=${fileId}的数据`);
    
    const { data, error } = await client
      .from('mindmaps')
      .select('opml_content, json_content')
      .eq('id', fileId)
      .single();
    
    if (error) {
      console.error('获取文件数据错误:', error);
      throw new Error(`获取文件数据错误: ${error.message}`);
    }

    if (!data) {
      console.error(`未找到ID=${fileId}的文件数据`);
      throw new Error(`未找到ID=${fileId}的文件数据`);
    }
    
    console.log(`成功获取文件ID=${fileId}的数据`);
    return data;
  } catch (error: unknown) {
    console.error('读取文件数据异常:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('未知错误');
    }
  }
}

// 增强的ID生成函数，确保唯一性
function generateUniqueId(prefix: string = 'node', existingIds: Set<string> = new Set<string>()) {
  let id;
  do {
    id = `${prefix}-${uuidv4().substring(0, 8)}`;
  } while (existingIds.has(id));
  
  existingIds.add(id);
  return id;
}

// 递归处理所有节点，确保每个节点都有唯一ID
function ensureNodeIds(node: any, parentId: string | null = null, level: number = 0, existingIds: Set<string> = new Set<string>()) {
  if (!node) return node;
  
  // 确保节点有ID
  if (!node.id) {
    node.id = generateUniqueId('node', existingIds);
  }
  
  // 处理子节点
  if (node.children && Array.isArray(node.children)) {
    node.children = node.children.map((child: any) => 
      ensureNodeIds(child, node.id, level + 1, existingIds)
    );
  }
  
  // 为保险起见，确保节点有topic属性
  if (!node.topic && node.text) {
    node.topic = node.text;
  } else if (!node.topic) {
    node.topic = '未命名节点';
  }
  
  // 记录节点的层级，用于后续布局
  node.level = level;
  node.parentId = parentId;
  
  return node;
}

// 定义函数返回值的接口
interface MindElixirData {
  nodeData: any;
  meta: {
    totalNodes: number;
    processedNodes: number;
    skippedNodes: number;
    maxDepthReached: boolean;
    [key: string]: any; // 允许添加其他元数据属性
  };
}

// 改进的OPML转换函数，更健壮地处理各种格式
export async function convertOpmlToMindElixir(opmlContent: string, maxNodes = 3000, maxDepth = 10): Promise<MindElixirData> {
  try {
    // 使用更精确的XML解析配置
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      explicitChildren: false,
      mergeAttrs: true,
      attrkey: '$',
      trim: true,
      normalize: true
    });
    const result = await parser.parseStringPromise(opmlContent);
    
    console.log('OPML解析结果:', JSON.stringify(result).substring(0, 500) + '...');
    
    if (!result || !result.opml || !result.opml.body || !result.opml.body.outline) {
      console.error('OPML结构无效');
      return { nodeData: { id: 'root', topic: '无效的OPML数据', children: [] }, meta: { totalNodes: 1, processedNodes: 1, skippedNodes: 0, maxDepthReached: false } };
    }
    
    // 提取标题，优先从OPML头部获取
    let rootTopic = '思维导图';
    if (result.opml.head && result.opml.head.title) {
      rootTopic = result.opml.head.title;
    }
    
    // 创建根节点
    const rootNode: {
      id: string;
      topic: string;
      expanded: boolean;
      children: any[];
      meta?: {
        totalNodes: number;
        processedNodes: number;
        skippedNodes: number;
        maxDepthReached: boolean;
        maxDepth: number;
      };
    } = {
      id: 'root',
      topic: rootTopic,
      expanded: true,
      children: []
    };
    
    // 计数已处理的节点和跳过的节点
    let totalNodes = 1; // 根节点算一个
    let processedNodes = 0;
    let skippedNodes = 0;
    let maxDepthReached = false;
    let skippedDepth: {[key: number]: number} = {};
    
    // 递归处理OPML节点
    function processOutline(outline: any, parent: any, depth = 1) {
      if (!outline) return;
      
      // 深度限制检查
      if (depth > maxDepth) {
        if (!maxDepthReached) {
          console.warn(`达到最大深度限制 ${maxDepth}，后续深层节点将被跳过`);
          maxDepthReached = true;
        }
        skippedDepth[depth] = (skippedDepth[depth] || 0) + 1;
        return;
      }
      
      // 节点数量限制检查
      if (totalNodes >= maxNodes) {
        if (skippedNodes === 0) {
          console.warn(`达到最大节点数量限制 ${maxNodes}，后续节点将被跳过`);
        }
        skippedNodes++;
        return;
      }
      
      // 确保outline是数组
      const outlines = Array.isArray(outline) ? outline : [outline];
      
      outlines.forEach((item: any) => {
        // 节点数量再次检查（循环内）
        if (totalNodes >= maxNodes) {
          skippedNodes++;
          return;
        }
        
        // 提取节点文本，按优先级处理多种可能的属性
        let nodeTopic = '未命名节点';
        
        // 处理各种可能的文本属性格式
        if (item.$ && item.$.text) {
          nodeTopic = item.$.text;
        } else if (item.text) {
          nodeTopic = item.text;
        } else if (item._mubu_text) {
          try {
            // 解码URL编码并移除HTML标签
            nodeTopic = decodeURIComponent(item._mubu_text).replace(/<[^>]*>/g, '');
          } catch (e) {
            nodeTopic = item._mubu_text;
          }
        } else if (item.$ && item.$._text) {
          nodeTopic = item.$._text;
        } else if (item.$ && item.$.title) {
          nodeTopic = item.$.title;
        } else if (item.title) {
          nodeTopic = item.title;
        } else if (item._) {
          nodeTopic = item._;
        }
        
        // 创建节点并添加唯一ID
        const node = {
          id: `node-${uuidv4().substring(0, 8)}`,
          topic: nodeTopic.trim() || '未命名节点',
          expanded: depth <= 3, // 只有前3层默认展开
          depth: depth, // 记录节点深度
          children: []
        };
        
        totalNodes++; // 增加总节点计数
        processedNodes++; // 增加已处理节点计数
        
        // 添加到父节点
        parent.children.push(node);
        
        // 处理子节点 - 处理更多可能的子节点字段
        if (item.outline) {
          processOutline(item.outline, node, depth + 1);
        } else if (item.children) {
          processOutline(item.children, node, depth + 1);
        } else if (item.$ && item.$.children) {
          processOutline(item.$.children, node, depth + 1);
        }
      });
    }
    
    // 开始处理
    processOutline(result.opml.body.outline, rootNode);
    
    console.log(`OPML解析完成，共处理 ${totalNodes} 个节点，跳过 ${skippedNodes} 个节点`);
    if (maxDepthReached) {
      console.log(`由于深度限制跳过的节点详情:`, skippedDepth);
    }
    
    // 添加元数据信息
    rootNode.meta = {
      totalNodes: totalNodes,
      processedNodes: processedNodes,
      skippedNodes: skippedNodes,
      maxDepthReached: maxDepthReached,
      maxDepth: maxDepth
    };
    
    // 确保所有节点都有ID
    const processedRoot = ensureNodeIds(rootNode);
    
    // 输出前几个节点用于调试
    console.log('处理后的根节点:', JSON.stringify(processedRoot).substring(0, 500) + '...');
    if (processedRoot.children && processedRoot.children.length > 0) {
      console.log(`第一级节点数量: ${processedRoot.children.length}`);
      console.log('第一个子节点:', JSON.stringify(processedRoot.children[0]).substring(0, 300) + '...');
    }
    
    return { 
      nodeData: processedRoot,
      meta: {
        totalNodes: totalNodes,
        processedNodes: processedNodes,
        skippedNodes: skippedNodes,
        maxDepthReached: maxDepthReached
      }
    } as MindElixirData;
    
  } catch (error: unknown) {
    console.error('转换OPML出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      if (error.stack) {
        console.error('错误堆栈:', error.stack);
      }
    }
    return { 
      nodeData: { 
        id: 'root', 
        topic: '转换OPML时发生错误', 
        children: [] 
      },
      meta: {
        totalNodes: 1,
        processedNodes: 1,
        skippedNodes: 0,
        maxDepthReached: false
      }
    } as MindElixirData;
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
  } catch (error: unknown) {
    console.error('转换数据时出错:', error);
    return DEFAULT_MINDMAP_DATA;
  }
}

// 从Supabase获取活跃的思维导图数据
async function getActiveMindMapFromSupabase() {
  try {
    console.log('从Supabase获取活跃思维导图数据');
    
    // 检查 supabase 客户端是否可用
    if (!supabaseAdmin && !supabase) {
      console.error('Supabase 客户端未初始化，可能是环境变量缺失');
      throw new Error('数据库连接失败，请检查环境配置');
    }
    
    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase;
    
    // 显式检查确保client不为null (TypeScript类型安全)
    if (!client) {
      throw new Error('无法初始化Supabase客户端');
    }
    
    // 查询活跃的思维导图
    const { data, error } = await client
      .from('mindmaps')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('查询活跃思维导图失败:', error);
      return null;
    }
    
    if (!data) {
      console.warn('未找到活跃的思维导图数据');
      return null;
    }
    
    console.log(`找到活跃思维导图: ${data.file_name}`);
    return data;
  } catch (error: unknown) {
    console.error('获取思维导图数据失败:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 从请求获取ID
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      console.error('未提供文件ID');
      return NextResponse.json(
        { error: '未提供文件ID' },
        { status: 400 }
      );
    }
    
    // 检查Supabase客户端是否初始化
    if (!supabase && !supabaseAdmin) {
      console.error('Supabase客户端未初始化，无法处理请求');
      return NextResponse.json(
        { 
          error: 'Supabase客户端未初始化，请检查环境配置', 
          details: {
            supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabase_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            service_key_exists: !!process.env.SUPABASE_SERVICE_KEY
          }
        },
        { status: 500 }
      );
    }
    
    console.log(`正在获取ID=${fileId}的思维导图数据`);
    
    let fileData;
    try {
      fileData = await fetchCompleteFileData(fileId);
    } catch (fetchError) {
      console.error('获取文件数据失败:', fetchError);
      return NextResponse.json(
        { error: `获取文件数据失败: ${(fetchError as Error).message}` },
        { status: 500 }
      );
    }
    
    if (!fileData) {
      return NextResponse.json(
        { error: '未找到文件数据' },
        { status: 404 }
      );
    }
    
    let result;
    
    // 优先使用已存储的JSON数据
    if (fileData.json_content) {
      console.log(`找到文件ID=${fileId}的JSON数据`);
      
      // 验证并确保所有节点都有ID
      const jsonData = typeof fileData.json_content === 'string' 
        ? JSON.parse(fileData.json_content) 
        : fileData.json_content;
      
      // 获取根节点
      const rootData = jsonData.nodeData || jsonData;
      const rootNode = rootData.root || rootData;
      
      // 确保所有节点都有唯一ID
      const processedData = { nodeData: ensureNodeIds(rootNode) };
      
      result = processedData;
    }
    // 如果没有JSON数据，从OPML转换
    else if (fileData.opml_content) {
      console.log(`将文件ID=${fileId}的OPML内容转换为思维导图数据`);
      result = await convertOpmlToMindElixir(fileData.opml_content);
    }
    else {
      console.error(`文件ID=${fileId}的数据不完整`);
      return NextResponse.json(
        { error: '文件数据不完整，缺少json_content和opml_content' },
        { status: 400 }
      );
    }
    
    // 最终验证和修复
    if (!validateMindMapData(result)) {
      console.warn('数据验证失败，尝试修复');
      // 尝试构建最小可用结构
      result = {
        nodeData: {
          id: 'root',
          topic: '数据加载错误，已创建临时结构',
          children: []
        }
      };
    }
    
    console.log(`成功处理ID=${fileId}的思维导图数据`);
    return NextResponse.json(result);
  
  } catch (error: unknown) {
    console.error('获取思维导图数据时出错:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `获取思维导图数据失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 