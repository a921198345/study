import fs from 'fs/promises';
import path from 'path';

// 关键词到节点ID的映射类型
type KeywordMap = Record<string, string>;

// 缓存已加载的关键词映射
let keywordCache: KeywordMap | null = null;

/**
 * 从思维导图数据中构建关键词映射表
 */
export async function buildKeywordMap(forceRefresh = false): Promise<KeywordMap> {
  // 如果已有缓存且不强制刷新，直接返回
  if (keywordCache && !forceRefresh) {
    return keywordCache;
  }
  
  try {
    // 从民法思维导图文件加载数据
    const filePath = path.join(process.cwd(), 'data/pdfs', '1745821419752-03、2025民法客观题思维导图_共45页-tree.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const mindmapData = JSON.parse(fileContent);
    
    // 构建关键词映射
    const keywordMap: KeywordMap = {};
    
    // 递归遍历思维导图节点
    function traverseNode(node: any) {
      if (node.title) {
        // 添加标题作为关键词
        keywordMap[node.title.trim()] = node.id;
        
        // 如果有内容，从内容中提取关键词
        if (node.content) {
          // 匹配内容中的关键词（简化示例）
          const contentKeywords = node.content.split(/[,，、\s\n]/).filter(Boolean);
          contentKeywords.forEach((keyword: string) => {
            if (keyword.length >= 2) { // 仅添加长度>=2的词，避免太多无意义的短词
              keywordMap[keyword.trim()] = node.id;
            }
          });
        }
      }
      
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverseNode);
      }
    }
    
    // 处理根节点
    traverseNode(mindmapData[0]);
    
    // 更新缓存
    keywordCache = keywordMap;
    return keywordMap;
  } catch (error) {
    console.error('Error building keyword map:', error);
    return {};
  }
}

/**
 * 从文本中提取关键词并匹配节点ID
 */
export async function extractKeywords(text: string, limit = 3): Promise<string[]> {
  // 获取关键词映射
  const keywordMap = await buildKeywordMap();
  
  // 找到文本中包含的所有关键词
  const matchedNodeIds: string[] = [];
  const matchedKeywords: Set<string> = new Set();
  
  // 按照关键词长度降序排序（优先匹配更长/更具体的关键词）
  const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (text.includes(keyword) && !matchedKeywords.has(keyword)) {
      matchedKeywords.add(keyword);
      const nodeId = keywordMap[keyword];
      if (nodeId && !matchedNodeIds.includes(nodeId)) {
        matchedNodeIds.push(nodeId);
      }
      
      // 达到限制数量后停止
      if (matchedNodeIds.length >= limit) {
        break;
      }
    }
  }
  
  return matchedNodeIds;
}

/**
 * 获取所有可用的思维导图信息
 */
export async function getAvailableMindmaps() {
  try {
    // 这里示例使用固定返回，实际应从文件系统或数据库获取
    return [
      {
        id: '1745821419752-03、2025民法客观题思维导图_共45页',
        title: '2025民法思维导图',
        subject: '民法',
        nodeCount: 2000,
      }
    ];
  } catch (error) {
    console.error('Error getting available mindmaps:', error);
    return [];
  }
} 