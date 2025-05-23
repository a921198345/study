import { DeepSeekAI } from './deepseek-ai';
import { createClient } from '@supabase/supabase-js';

// 改进Supabase初始化代码部分
// 获取Supabase配置信息
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 检查配置完整性，提供更明确的警告信息
let supabaseClient: any = null;

try {
  // 尝试初始化Supabase客户端
  if (supabaseUrl && supabaseAnonKey) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);
    console.log('Supabase客户端初始化成功');
  } else {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey && !supabaseServiceKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY');
    
    console.warn(`警告: Supabase配置不完整，缺少以下环境变量: ${missingVars.join(', ')}。将使用本地知识库。`);
    console.warn('如需连接Supabase，请在Vercel项目设置中添加这些环境变量');
  }
} catch (error) {
  console.error('Supabase客户端初始化失败:', error);
  console.warn('将使用本地知识库');
}

// 缓存常见问题的结果
const knowledgeCache = new Map<string, string>();
const CACHE_TTL = 1000 * 60 * 30; // 缓存30分钟

type CacheEntry = {
  context: string;
  timestamp: number;
};

// 法律专业术语映射表，用于纠正常见错误
const legalTermCorrections: Record<string, string> = {
  '民法点': '民法典',
  '行政法点': '行政法典',
  '刑法点': '刑法典',
  '商法点': '商法典',
  '宪法点': '宪法典',
  '经济点': '经济法',
  '罪行': '犯罪',
  '辩论': '辩护',
  '原则性': '原则',
  '法院长': '法院院长'
};

// 定义知识检索结果类型
export type KnowledgeResult = {
  context: string;
  correctedQuery: string;
  wasTermCorrected: boolean;
};

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  created_at: string;
  updated_at?: string;
}

// 示例知识库数据（实际应用中可能来自数据库或API）
const knowledgeBase: KnowledgeItem[] = [
  {
    id: "law-001",
    category: "民法",
    title: "合同法基础知识",
    content: "合同是民事主体之间设立、变更、终止民事法律关系的协议。合同的订立通常需要符合以下要素：主体适格、意思表示真实、内容合法。合同的效力分为有效、无效、可撤销和效力待定四种情况。",
    tags: ["合同法", "民法", "法律效力"],
    source: "《中华人民共和国民法典》",
    created_at: "2023-01-01",
    updated_at: "2023-06-15"
  },
  {
    id: "law-002",
    category: "刑法",
    title: "刑事责任年龄",
    content: "根据《中华人民共和国刑法》规定，已满十六周岁的人犯罪，应当负刑事责任。已满十四周岁不满十六周岁的人，犯故意杀人、故意伤害致人重伤或者死亡、强奸、抢劫、贩卖毒品、放火、爆炸、投放危险物质罪的，应当负刑事责任。已满十二周岁不满十四周岁的人，犯故意杀人、故意伤害罪，致人死亡或者以特别残忍手段致人重伤造成严重残疾，情节恶劣，经最高人民检察院核准追诉的，应当负刑事责任。",
    tags: ["刑法", "刑事责任", "年龄"],
    source: "《中华人民共和国刑法》第十七条",
    created_at: "2023-02-10",
    updated_at: "2023-07-20"
  },
  {
    id: "study-001",
    category: "学习方法",
    title: "艾宾浩斯记忆曲线",
    content: "艾宾浩斯记忆曲线表明，如果没有复习，人类大脑对新知识的记忆会随时间呈指数型衰减。为了提高记忆效果，建议在学习新知识后的第1天、第2天、第4天、第7天和第15天进行复习，形成长期记忆。结合间隔重复和主动回忆的方法，可以显著提高学习效率。",
    tags: ["记忆方法", "学习效率", "复习策略"],
    created_at: "2023-03-15"
  },
  {
    id: "study-002",
    category: "考试技巧",
    title: "考前焦虑缓解方法",
    content: "考前焦虑是正常现象，适度紧张有助于保持警觉和专注。缓解方法包括：1. 充分准备，建立自信；2. 制定合理的复习计划，避免临时抱佛脚；3. 掌握深呼吸等放松技巧；4. 保持规律作息和适量运动；5. 考前可视化成功场景；6. 接受一定程度的焦虑，不过分追求完美。",
    tags: ["考试焦虑", "心理调适", "压力管理"],
    created_at: "2023-04-20",
    updated_at: "2023-08-10"
  }
];

// 初始化DeepSeekAI客户端
const aiClient = new DeepSeekAI();

/**
 * 简单的知识库搜索函数 - 仅作为示例实现
 * @param query 用户查询
 * @returns 匹配的知识条目或null
 */
// 这个是旧版本，保留为参考但不导出
function searchKnowledgeSimple(query: string): KnowledgeItem | null {
  // 提取查询中的关键词
  const keywords = extractKeywords(query);
  
  // 简单的相关性评分
  const scoredResults = knowledgeBase.map(item => {
    const score = calculateRelevanceScore(item, keywords);
    return { item, score };
  });
  
  // 按相关性排序
  scoredResults.sort((a, b) => b.score - a.score);
  
  // 返回最相关的结果（如果相关性足够高）
  if (scoredResults.length > 0 && scoredResults[0].score > 0.3) {
    return scoredResults[0].item;
  }
  
  return null;
}

/**
 * 从查询中提取关键词
 * @param query 用户查询
 * @returns 关键词数组
 */
function extractKeywords(query: string): string[] {
  // 去除常见停用词（实际应用中可能需要更复杂的NLP处理）
  const stopWords = ['的', '是', '在', '了', '和', '与', '或', '有', '什么', '如何', '为什么', '怎么'];
  
  // 分词并过滤停用词
  return query
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ') // 保留中文、英文和数字
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word));
}

/**
 * 计算内容与关键词的相关性得分
 * @param item 知识库条目
 * @param keywords 关键词数组
 * @returns 相关性得分(0-1)
 */
function calculateRelevanceScore(item: KnowledgeItem, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  
  // 将知识条目转换为文本进行匹配
  const itemText = `${item.title} ${item.content} ${item.tags.join(' ')} ${item.category}`.toLowerCase();
  
  // 计算匹配的关键词数量
  const matchedKeywords = keywords.filter(keyword => itemText.includes(keyword));
  
  // 简单的TF计算（匹配次数）
  let totalMatches = 0;
  for (const keyword of matchedKeywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = itemText.match(regex);
    totalMatches += matches ? matches.length : 0;
  }
  
  // 标题匹配加权
  const titleMatchBonus = keywords.some(keyword => item.title.toLowerCase().includes(keyword)) ? 0.2 : 0;
  
  // 类别匹配加权
  const categoryMatchBonus = keywords.some(keyword => item.category.toLowerCase().includes(keyword)) ? 0.1 : 0;
  
  // 计算最终得分（匹配关键词比例 + 匹配次数权重 + 额外加权）
  const keywordRatio = matchedKeywords.length / keywords.length;
  const frequencyWeight = Math.min(totalMatches / (keywords.length * 3), 0.3); // 限制频率权重最大为0.3
  
  return keywordRatio * 0.4 + frequencyWeight + titleMatchBonus + categoryMatchBonus;
}

/**
 * 获取知识库中的所有类别
 * @returns 类别数组
 */
export function getKnowledgeCategories(): string[] {
  const categories = new Set(knowledgeBase.map(item => item.category));
  return Array.from(categories);
}

/**
 * 按类别获取知识条目
 * @param category 类别名称
 * @returns 该类别的知识条目数组
 */
export function getKnowledgeByCategory(category: string): KnowledgeItem[] {
  return knowledgeBase.filter(item => item.category === category);
}

/**
 * 获取知识条目详情
 * @param id 知识条目ID
 * @returns 知识条目或undefined
 */
export function getKnowledgeDetail(id: string): KnowledgeItem | undefined {
  return knowledgeBase.find(item => item.id === id);
}

/**
 * 检查问题是否已在缓存中
 * @param query 用户查询
 * @returns 缓存的结果或null
 */
function checkQuestionCache(query: string): string | null {
  const cacheKey = query.trim().toLowerCase();
  
  // 检查缓存中是否有这个问题
  if (knowledgeCache.has(cacheKey)) {
    const cachedValue = knowledgeCache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }
  
  return null;
}

/**
 * 将问题和答案缓存起来
 * @param query 用户查询
 * @param answer 回答内容
 */
function cacheQuestion(query: string, answer: string): void {
  const cacheKey = query.trim().toLowerCase();
  knowledgeCache.set(cacheKey, answer);
  
  // 可以在这里设置缓存过期时间，但简单实现中省略
}

/**
 * 在本地知识库中搜索相关内容
 * @param query 用户查询
 * @returns 匹配的知识条目数组
 */
function simpleKnowledgeSearch(query: string): KnowledgeItem[] {
  // 提取查询中的关键词
  const keywords = extractKeywords(query);
  
  // 简单的相关性评分
  const scoredResults = knowledgeBase.map(item => {
    const score = calculateRelevanceScore(item, keywords);
    return { item, score };
  });
  
  // 按相关性排序
  scoredResults.sort((a, b) => b.score - a.score);
  
  // 返回相关性足够高的结果
  return scoredResults
    .filter(result => result.score > 0.3)
    .map(result => result.item);
}

/**
 * 将搜索结果格式化为可读文本
 * @param results 知识条目数组
 * @returns 格式化的回答
 */
function formatSearchResults(results: KnowledgeItem[]): string {
  if (results.length === 0) {
    return '抱歉，我没有找到与您问题相关的内容。';
  }
  
  // 只使用最相关的结果
  const topResult = results[0];
  
  // 构建回答
  return `${topResult.title}\n\n${topResult.content}${topResult.source ? `\n\n来源: ${topResult.source}` : ''}`;
}

/**
 * 根据用户查询搜索基础法律知识
 * @param query 用户查询
 * @returns 
 */
export async function searchKnowledge(query: string): Promise<string> {
  // 首先尝试使用缓存
  const cachedResult = checkQuestionCache(query);
  if (cachedResult) {
    console.log('从缓存获取回答:', query);
    return cachedResult;
  }

  try {
    // 尝试通过DeepSeek API进行知识检索
    const answer = await aiClient.searchKnowledge(query);
    
    // 缓存结果
    cacheQuestion(query, answer);
    
    return answer;
  } catch (error) {
    console.error('AI知识检索失败，回退到本地搜索:', error);
    
    // 失败时回退到本地搜索
    const searchResults = simpleKnowledgeSearch(query);
    if (searchResults.length > 0) {
      // 构建一个基于搜索结果的回答
      const answer = formatSearchResults(searchResults);
      
      // 缓存结果
      cacheQuestion(query, answer);
      
      return answer;
    }
    
    return '抱歉，我没有找到与您问题相关的法律知识。请尝试更具体的法律问题。';
  }
}

// 修正常见错误的法律术语
function correctLegalTerms(query: string): { correctedQuery: string; wasTermCorrected: boolean } {
  // 定义常见错误术语映射
  const termCorrections: Record<string, string> = {
    '刑事责任能力': '刑事责任年龄',
    '刑事年龄': '刑事责任年龄',
    '结婚证': '结婚登记',
    '婚姻证': '结婚登记',
    '离婚证': '离婚登记',
    '合同有效性': '合同效力',
    '合同是否有效': '合同效力',
    '物权法': '物权',
    '继承法': '继承权'
  };

  let correctedQuery = query;
  let wasTermCorrected = false;

  // 检查查询中是否包含错误术语，并进行修正
  for (const [incorrectTerm, correctTerm] of Object.entries(termCorrections)) {
    if (query.includes(incorrectTerm)) {
      correctedQuery = correctedQuery.replace(incorrectTerm, correctTerm);
      wasTermCorrected = true;
    }
  }

  return { correctedQuery, wasTermCorrected };
}

// 格式化响应文本
export function formatResponse(text: string): string {
  // 修复包含过多星号的问题
  text = text.replace(/\*{3,}/g, '**');
  
  // 规范列表格式
  text = text.replace(/^\s*[•·]\s*/gm, '- ');
  
  // 删除多余空白行
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 删除多余空格
  text = text.replace(/\s{2,}/g, ' ');
  
  // 删除特殊字符
  text = text.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{S}]/gu, '');
  
  return text.trim();
}

// 格式化响应文本 - 用于与searchKnowledge函数配合使用
export function formatResponseText(text: string | KnowledgeItem | null): string {
  if (!text) {
    return '很抱歉，我没能找到相关信息。请尝试换一种提问方式，或者提供更多细节。';
  }
  
  // 如果是KnowledgeItem类型，提取内容
  if (typeof text !== 'string') {
    return formatResponse(text.content);
  }
  
  // 处理空字符串
  if (text.trim() === '') {
    return '很抱歉，我没能找到相关信息。请尝试换一种提问方式，或者提供更多细节。';
  }
  
  // 使用已有的格式化函数处理文本
  return formatResponse(text);
} 