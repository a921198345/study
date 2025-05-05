// 移除服务器端模块导入，只保留客户端安全部分
// 注意: 这是简化版本，仅包含客户端使用的功能

/**
 * 客户端版本的简化关键词提取（不访问文件系统）
 */
export function extractKeywordsClient(text: string): string[] {
  // 这是一个简化版，将民法常见关键词硬编码
  const keywordMap: Record<string, string> = {
    "物权": "category_1_1",
    "人身权": "category_1_2",
    "支配权": "category_1_3",
    "知识产权": "category_1_4",
    "形成权": "category_1_8",
    "民事权利": "category_1_50",
    "合同": "category_1_1046",
    "侵权责任": "category_1_1994",
    "健康权": "category_1_1617",
    "所有权": "category_1_100",
    "抵押权": "category_1_736",
    "民法典": "category_1_20",
    "债权": "category_1_500",
    "继承": "category_1_1800",
    "婚姻家庭": "category_1_1700",
    // 添加更多关键词映射
    "法律行为": "category_1_200",
    "代理": "category_1_220",
    "时效": "category_1_240",
    "担保物权": "category_1_700",
    "占有": "category_1_800",
    "人格权": "category_1_1600",
    "名誉权": "category_1_1640"
  };
  
  const matchedNodeIds: string[] = [];
  const matchedKeywords: Set<string> = new Set();
  
  // 按照关键词长度降序排序
  const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeywords) {
    if (text.includes(keyword) && !matchedKeywords.has(keyword)) {
      matchedKeywords.add(keyword);
      const nodeId = keywordMap[keyword];
      if (!matchedNodeIds.includes(nodeId)) {
        matchedNodeIds.push(nodeId);
      }
      
      // 最多返回3个节点
      if (matchedNodeIds.length >= 3) {
        break;
      }
    }
  }
  
  return matchedNodeIds;
}

/**
 * 获取所有可用的思维导图信息（客户端安全版本）
 */
export function getAvailableMindmapsClient() {
  return [
    {
      id: 'minfa',
      title: '2025民法思维导图',
      subject: '民法',
      nodeCount: 2000,
    }
  ];
}

// 法律关键词库
export const legalKeywords = [
  "民法", "刑法", "宪法", "行政法", "商法", "经济法", "婚姻法", "合同法", "继承法", 
  "侵权责任", "物权", "债权", "知识产权", "著作权", "专利权", "商标权", "法人", "自然人", 
  "法定代表人", "合同", "无效合同", "可撤销合同", "违约责任", "损害赔偿", "缔约过失责任", 
  "不当得利", "无因管理", "人身权", "隐私权", "名誉权", "肖像权", "婚姻", "离婚", "继承", 
  "遗嘱", "法定继承", "遗赠", "物权", "所有权", "用益物权", "抵押权", "质权", "留置权", 
  "占有"
];

// 学习关键词库
export const learningKeywords = [
  "学习计划", "复习", "考试", "笔记", "知识点", "题目", "案例", "课程", "教材", 
  "章节", "思维导图", "知识树", "总结", "背诵", "记忆", "理解", "分析", "应用", 
  "评价", "创新", "学习方法", "效率", "时间管理", "专注力", "学习动力", "学习习惯", 
  "记忆技巧", "思维方式", "学习风格", "自学", "指导", "教学", "讲解", "例题", 
  "习题", "练习", "测验", "模拟考", "真题"
];

// 情感关键词库
export const emotionalKeywords = [
  "压力", "焦虑", "紧张", "疲惫", "困惑", "沮丧", "挫折", "恐惧", "担忧", "害怕", 
  "不安", "失望", "自信", "激励", "鼓励", "动力", "坚持", "毅力", "耐心", "专注", 
  "放松", "休息", "调整", "平衡", "心态", "情绪", "感受", "体验", "成就感", "满足感", 
  "成功", "失败", "挑战", "机会", "成长", "进步", "提升", "突破", "改变", "适应"
];

// 日常聊天关键词库
export const conversationalKeywords = [
  "你好", "谢谢", "帮助", "建议", "问题", "想法", "看法", "观点", "认为", "觉得", 
  "认识", "了解", "知道", "明白", "理解", "解释", "说明", "描述", "介绍", "分享", 
  "讨论", "交流", "沟通", "对话", "闲聊", "聊天", "玩笑", "笑话", "幽默", "娱乐", 
  "兴趣", "爱好", "喜欢", "不喜欢", "赞同", "反对", "支持", "反驳", "质疑"
];

// 内容类型枚举
export enum ContentType {
  LEGAL = 'legal',
  LEARNING = 'learning',
  EMOTIONAL = 'emotional',
  CONVERSATIONAL = 'conversational',
  UNKNOWN = 'unknown'
}

// 识别内容类型
export function identifyContentType(content: string): ContentType {
  content = content.toLowerCase();
  
  let scores = {
    [ContentType.LEGAL]: 0,
    [ContentType.LEARNING]: 0,
    [ContentType.EMOTIONAL]: 0,
    [ContentType.CONVERSATIONAL]: 0
  };
  
  // 计算每个类别的匹配分数
  legalKeywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      scores[ContentType.LEGAL] += 1;
    }
  });
  
  learningKeywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      scores[ContentType.LEARNING] += 1;
    }
  });
  
  emotionalKeywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      scores[ContentType.EMOTIONAL] += 1;
    }
  });
  
  conversationalKeywords.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      scores[ContentType.CONVERSATIONAL] += 1;
    }
  });
  
  // 找出得分最高的类别
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    return ContentType.UNKNOWN;
  }
  
  // 如果多个类别得分相同且最高，优先级：法律 > 学习 > 情感 > 日常
  if (scores[ContentType.LEGAL] === maxScore) {
    return ContentType.LEGAL;
  } else if (scores[ContentType.LEARNING] === maxScore) {
    return ContentType.LEARNING;
  } else if (scores[ContentType.EMOTIONAL] === maxScore) {
    return ContentType.EMOTIONAL;
  } else {
    return ContentType.CONVERSATIONAL;
  }
} 