import { ZhipuAI } from '@/lib/zhipu-ai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase配置:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
});

// 初始化 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { 
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

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

// 搜索知识库 - 保留这个实现作为主要导出函数
export async function searchKnowledge(query: string): Promise<KnowledgeResult> {
  // 检查输入是否为空
  if (!query || query.trim() === '') {
    return {
      context: '',
      correctedQuery: query,
      wasTermCorrected: false
    };
  }

  // 修正常见错误的法律术语
  const { correctedQuery, wasTermCorrected } = correctLegalTerms(query);

  try {
    // 使用智谱AI API搜索知识
    const zhipuAI = new ZhipuAI();
    let context = await zhipuAI.searchKnowledge(correctedQuery);

    // 格式化响应文本
    if (context) {
      context = formatResponse(context);
    }

    return {
      context,
      correctedQuery,
      wasTermCorrected
    };
  } catch (error) {
    console.error('知识库检索失败:', error);
    
    // 发生错误时返回空结果
    return {
      context: '',
      correctedQuery,
      wasTermCorrected
    };
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