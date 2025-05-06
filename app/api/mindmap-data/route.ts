import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js'; // 导入xml2js库解析OPML文件
import { supabaseAdmin } from '@/lib/supabase';

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
    fixed = fixed.replace(/"[^"]+"\s*:/g, (match) => {
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
        const match = regex.exec(fixed);
        
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
          const topicMatch = /"topic"\s*:\s*(?:null)?"([^"]+)"/i.exec(extractedContent);
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

// 递归为节点添加ID
const ensureNodeIds = (node: any, prefix: string = 'node'): any => {
  if (!node) return null;
  
  // 如果节点没有ID，生成一个唯一ID
  if (!node.id) {
    node.id = `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  // 确保topic存在
  if (!node.topic && node.text) {
    node.topic = node.text;
  } else if (!node.topic) {
    node.topic = '未命名节点';
  }
  
  // 处理子节点
  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      node.children[i] = ensureNodeIds(node.children[i], `${node.id}-${i}`);
    }
  }
  
  return node;
};

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
      // 确保ID中不包含空格或其他特殊字符，使用更严格的过滤规则
      const nodeId = `node-${path.replace(/\s+/g, '')}-${idCounter}`.replace(/[^a-zA-Z0-9-_]/g, '-');
      
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
    
    // 创建安全的结果对象 - 确保所有格式和类型正确
    const result_data = {
      nodeData: {
        id: String(rootNode.id || 'root'),
        topic: String(rootNode.topic || '思维导图'),
        expanded: rootNode.expanded === true || rootNode.expanded === 'true' ? true : false,
        children: Array.isArray(rootNode.children) ? rootNode.children.filter(Boolean) : []
      }
    };
    
    // 额外的安全检查：确保每个子节点都有有效的id和topic
    if (Array.isArray(result_data.nodeData.children)) {
      result_data.nodeData.children = result_data.nodeData.children.map(child => {
        if (!child) return null;
        return {
          id: String(child.id || `child-${Math.random().toString(36).substr(2, 9)}`),
          topic: String(child.topic || '节点'),
          expanded: child.expanded === true || child.expanded === 'true' ? true : false,
          children: Array.isArray(child.children) ? child.children.filter(Boolean) : []
        };
      }).filter(Boolean); // 过滤掉null值
    }
    
    // 确保所有节点（包括深层嵌套节点）都有ID
    result_data.nodeData = ensureNodeIds(result_data.nodeData);
    
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
    let jsonString = ''; // 在外部定义变量，确保在catch块中可访问
    try {
      jsonString = JSON.stringify(result_data);
      
      // 主动检查所有的响应数据是否包含格式问题
      console.warn('API响应前进行深度格式检查和修复');
      
      // 使用增强的JSON修复函数对所有数据进行处理
      const sanitizedJson = sanitizeJsonString(jsonString);
      
      try {
        // 解析修复后的JSON
        const validatedData = JSON.parse(sanitizedJson);
        
        // 深度验证数据结构
        if (!validatedData || typeof validatedData !== 'object') {
          console.warn('修复后的数据不是有效对象，使用默认数据');
          return DEFAULT_MINDMAP_DATA; // 直接返回数据对象，不是NextResponse
        }
        
        // 确保nodeData结构存在且合法
        if (!validatedData.nodeData || 
            typeof validatedData.nodeData !== 'object' || 
            !validatedData.nodeData.id || 
            !validatedData.nodeData.topic) {
          console.warn('修复后的数据结构不完整，使用默认数据');
          return DEFAULT_MINDMAP_DATA; // 直接返回数据对象，不是NextResponse
        }
        
        // 确保nodeData.children是数组
        if (validatedData.nodeData.children && !Array.isArray(validatedData.nodeData.children)) {
          console.warn('children不是数组，修复数据结构');
          validatedData.nodeData.children = [];
        }
        
        // 确保expanded是布尔值
        validatedData.nodeData.expanded = 
          validatedData.nodeData.expanded === true || 
          validatedData.nodeData.expanded === 'true' ? true : false;
        
        // 最终安全检查 - 再次序列化和解析以确保JSON格式有效
        const finalCheck = JSON.stringify(validatedData);
        JSON.parse(finalCheck); // 如果这里出错，会被catch捕获
        
        console.log('数据格式验证通过，返回修复后的数据');
        return validatedData; // 直接返回数据对象，不是NextResponse
      } catch (validationError) {
        console.error('最终验证失败，返回默认数据:', validationError);
        return DEFAULT_MINDMAP_DATA; // 直接返回数据对象，不是NextResponse
      }
    } catch (jsonError) {
      console.error('最终JSON验证失败，尝试数据修复');
      
      try {
        // 最后的挽救尝试：使用formattedData直接进行修复尝试
        // 如果之前的jsonString有效，使用它；否则重新尝试序列化
        const dataToFix = jsonString || (result_data ? JSON.stringify(result_data) : '{}');
        const emergencyFixed = sanitizeJsonString(dataToFix);
        
        // 如果修复成功就返回修复后的数据
        if (emergencyFixed !== '{}') {
          const emergencyData = JSON.parse(emergencyFixed);
          console.log('紧急修复成功，返回修复后的数据');
          return emergencyData; // 直接返回数据对象，不是NextResponse
        }
      } catch (finalError) {
        console.error('紧急修复也失败，返回默认数据');
      }
      
      return DEFAULT_MINDMAP_DATA; // 直接返回数据对象，不是NextResponse
    }
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

// 从Supabase获取活跃的思维导图数据
async function getActiveMindMapFromSupabase() {
  try {
    console.log('从Supabase获取活跃思维导图数据');
    
    // 查询活跃的思维导图
    const { data, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('获取思维导图数据失败:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取活跃的思维导图数据
    const activeMindMap = await getActiveMindMapFromSupabase();
    
    // 如果没有找到活跃思维导图，返回默认数据
    if (!activeMindMap) {
      console.log('没有活跃的思维导图，返回默认数据');
      return NextResponse.json(DEFAULT_MINDMAP_DATA);
    }
    
    // 如果有json_content字段，直接使用
    if (activeMindMap.json_content) {
      console.log('使用存储的JSON数据');
      
      // 进行额外验证
      if (validateMindMapData(activeMindMap.json_content.nodeData)) {
        return NextResponse.json(activeMindMap.json_content);
      } else {
        console.warn('存储的JSON数据无效，尝试修复');
        
        // 尝试修复JSON
        try {
          // 将对象转为字符串再修复
          const jsonString = JSON.stringify(activeMindMap.json_content);
          const fixedJsonString = sanitizeJsonString(jsonString);
          const fixedData = JSON.parse(fixedJsonString);
          
          if (validateMindMapData(fixedData.nodeData)) {
            console.log('JSON修复成功');
            return NextResponse.json(fixedData);
          }
        } catch (e) {
          console.error('JSON修复失败:', e);
          // 继续处理，尝试其他方法
        }
      }
    }
    
    // 如果json_content无效或不存在，尝试使用OPML内容
    if (activeMindMap.opml_content) {
      console.log('尝试解析OPML内容');
      
      try {
        // 检测文件格式
        const format = detectFileFormat(activeMindMap.opml_content);
        
        if (format === 'xml') {
          // 将OPML转换为Mind-Elixir格式
          const mindElixirData = await convertOpmlToMindElixir(activeMindMap.opml_content);
          
          // 增加日志，查看转换返回的数据类型和内容
          console.log('OPML转换返回数据类型:', typeof mindElixirData);
          console.log('OPML转换返回数据包含字段:', Object.keys(mindElixirData || {}));
          
          // 确保返回的是有效对象且包含nodeData
          if (mindElixirData && typeof mindElixirData === 'object' && mindElixirData.nodeData) {
            // 增加额外的nodeData验证
            if (validateMindMapData(mindElixirData.nodeData)) {
              console.log('OPML转换成功，数据验证通过');
              
              // 确保所有节点（包括深层嵌套节点）都有ID
              const processedData = {
                ...mindElixirData,
                nodeData: ensureNodeIds(mindElixirData.nodeData)
              };
              
              return NextResponse.json(processedData);
            } else {
              console.warn('OPML转换返回的数据无效，nodeData结构不正确');
            }
          } else {
            console.warn('OPML转换返回的数据无效，不是对象或缺少nodeData:', mindElixirData);
          }
        } else {
          console.warn('文件格式不是XML:', format);
        }
      } catch (e) {
        console.error('OPML处理失败，详细错误:', e);
        // 继续处理，返回默认数据
      }
    } else {
      console.warn('活跃思维导图没有OPML内容');
    }
    
    // 如果所有尝试都失败，返回默认数据
    console.warn('所有数据处理尝试失败，返回默认数据');
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
    
  } catch (error) {
    console.error('获取思维导图数据过程中出错，详细错误:', error);
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  }
} 