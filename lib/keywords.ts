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
      id: '1745821419752-03、2025民法客观题思维导图_共45页',
      title: '2025民法思维导图',
      subject: '民法',
      nodeCount: 2000,
    }
  ];
} 