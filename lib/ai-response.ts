import { getCurrentPersona, applyPersonaStyle } from "./persona";

// 内容类型枚举
export enum ContentType {
  UNSAFE = 'unsafe',
  LEGAL = 'legal',
  STUDY = 'study',
  EMOTIONAL = 'emotional',
  CASUAL = 'casual',
}

export const CONTENT_TYPE_NAMES: Record<ContentType, string> = {
  [ContentType.UNSAFE]: '不安全',
  [ContentType.LEGAL]: '法律',
  [ContentType.STUDY]: '学习',
  [ContentType.EMOTIONAL]: '情感',
  [ContentType.CASUAL]: '日常',
};

// 安全策略配置接口
export interface SafetyConfig {
  allowedContentTypes: ContentType[];
}

// 默认安全策略配置（排除不安全内容）
export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  allowedContentTypes: [
    ContentType.LEGAL,
    ContentType.STUDY,
    ContentType.EMOTIONAL,
    ContentType.CASUAL
  ]
};

/**
 * 内容类型检测：分析用户消息并确定其类型
 * @param message 用户消息
 * @returns 内容类型
 */
export function detectContentType(message: string): ContentType {
  // 确保输入有效
  if (!message || typeof message !== 'string') {
    return ContentType.CASUAL; // 默认为日常对话
  }

  try {
    const lowerMessage = message.toLowerCase();

    // 增强不安全内容检测 - 增加更多模式匹配，覆盖更广泛的不适当内容
    const unsafePatterns = [
      // 色情内容 - 增强匹配模式
      /色情|pornography|情色|裸体|自慰|性交|卖淫|嫖娼|黄片|成人电影|性玩具|性服务|脱光|裸露|裸照|暴露|私处|胸部|下体|内衣|内裤/i,
      // 毒品内容
      /毒品|drug|大麻|海洛因|可卡因|冰毒|吸毒|贩毒|致幻剂|吸食|注射|嗑药/i,
      // 自残自杀
      /自杀|割腕|自残|上吊|跳楼|轻生|结束生命|厌世|suicide|自我伤害|死亡方法/i,
      // 恐怖主义
      /恐怖主义|炸弹|爆炸物|制造炸弹|恐怖袭击|枪击|恐怖分子|屠杀|绑架|terrorism/i,
      // 赌博
      /赌博|博彩|赌场|赌钱|赌注|赌局|押注|彩票|轮盘|扑克|赌桌|赌资|赌术|gambling/i,
      // 不文明语言
      /操你|fuck|傻逼|废物|滚蛋|混蛋|白痴|笨蛋|贱人|贱货|婊子|狗娘养|去死/i
    ];

    // 安全检查 - 单独捕获每个模式的可能异常
    for (const pattern of unsafePatterns) {
      try {
        if (pattern.test(lowerMessage)) {
          console.log('检测到不安全内容');
          return ContentType.UNSAFE;
        }
      } catch (e) {
        console.error('正则匹配出错:', e);
        // 出错时保守处理为不安全内容
        return ContentType.UNSAFE;
      }
    }

    // 法律内容检测
    const legalPatterns = [
      /律师|法官|法院|法律|诉讼|起诉|被告|原告|债务|债权|遗嘱|合同|协议|违约|侵权|赔偿|拘留|逮捕|刑事|民事|行政法|诉讼|裁决|判决|执行|监禁|仲裁|辩护|上诉|证据|案件|辩论|辩护人|陪审团|法定|控方|辩方|判例|罪行|犯罪|法规|条例|法条|传票|司法|立法|庭审|庭前|宣判|法典|判刑|量刑|刑罚|罚金|责任|免责|限责|专利|商标|著作权|知识产权|隐私权|产权|权利/i,
    ];

    for (const pattern of legalPatterns) {
      try {
        if (pattern.test(lowerMessage)) {
          return ContentType.LEGAL;
        }
      } catch (e) {
        console.error('法律内容检测出错:', e);
      }
    }

    // 学习内容检测
    const studyPatterns = [
      /学习|考试|复习|题目|作业|课程|教材|课本|笔记|复习资料|考点|试卷|成绩|学校|大学|高考|中考|公务员考试|计划|提分|刷题|错题|教育|培训|辅导|课外|study|exam|test|homework|assignment|grade|review|textbook|note|class|course|university|college|learning|education|training|tutorial|lesson|lecture|professor|teacher|student|school|question|answer|quiz|academic/i,
    ];

    for (const pattern of studyPatterns) {
      try {
        if (pattern.test(lowerMessage)) {
          return ContentType.STUDY;
        }
      } catch (e) {
        console.error('学习内容检测出错:', e);
      }
    }

    // 情感内容检测
    const emotionalPatterns = [
      /心情|感受|伤心|难过|开心|高兴|悲伤|焦虑|压力|抑郁|孤独|寂寞|爱情|恋爱|分手|失恋|挽回|感情|暗恋|表白|喜欢|相处|关心|思念|忘记|情感|感动|哭泣|微笑|笑容|泪水|痛苦|后悔|遗憾|挫折|困难|坚持|放弃|烦恼|纠结|苦恼|困惑|迷茫|方向|目标|梦想|希望|期待|失望|沮丧|心累|疲惫|释怀|宽慰|安慰|鼓励|支持|理解|接受|认可|肯定|否定|拒绝|伤害|包容|tolerance|心理|情绪|mood|emotion|feeling|sad|happy|joy|sorrow|anxiety|stress|depression|lonely|solitude|love|relationship|breakup|affection|crush|confession|like|care|miss|forget|moved|cry|smile|tears|pain|regret|frustration|difficulty|persevere|give up|troubled|confused|direction|goal|dream|hope|expect|disappointment|dejected|tired|relief|comfort|encourage|support|understand|accept|approve|deny|reject|hurt|embrace|psychology/i,
    ];

    for (const pattern of emotionalPatterns) {
      try {
        if (pattern.test(lowerMessage)) {
          return ContentType.EMOTIONAL;
        }
      } catch (e) {
        console.error('情感内容检测出错:', e);
      }
    }

    // 默认为日常内容
    return ContentType.CASUAL;
  } catch (error) {
    console.error('内容类型检测出错:', error);
    // 发生错误时默认安全处理为日常对话
    return ContentType.CASUAL;
  }
}

/**
 * 生成AI响应
 * @param message 用户消息
 * @param safetyConfig 安全策略配置（可选）
 * @returns AI响应内容
 */
export function generateAIResponse(
  message: string, 
  safetyConfig: SafetyConfig = DEFAULT_SAFETY_CONFIG
): string {
  // 确保输入有效
  if (!message || typeof message !== 'string') {
    return '很抱歉，我无法处理此类消息。请尝试发送文本内容。';
  }

  // 检测内容类型  
  const contentType = detectContentType(message);
  
  // 如果是不安全内容，返回安全提示
  if (contentType === ContentType.UNSAFE) {
    return '很抱歉，我无法回答与不安全内容相关的问题。我的设计目标是帮助您学习和解决问题。如果您有关于法律知识或学习方法的问题，我很乐意为您提供帮助。';
  }
  
  // 检查该内容类型是否被允许处理
  if (!safetyConfig.allowedContentTypes.includes(contentType)) {
    return `很抱歉，我目前只能回答${safetyConfig.allowedContentTypes.map(type => CONTENT_TYPE_NAMES[type]).join('、')}相关的问题。`;
  }
  
  // 默认使用小雪人格
  const personaName = '小雪';
  
  // 根据内容类型生成回答
  switch (contentType) {
    case ContentType.LEGAL:
      return generateLegalResponse(message, personaName);
    case ContentType.STUDY:
      return generateStudyResponse(message, personaName);
    case ContentType.EMOTIONAL:
      return generateEmotionalResponseWithPersona(message, personaName);
    case ContentType.CASUAL:
      return generateCasualResponse(message, personaName);
    default:
      // 默认回复
      return `你好！我是${personaName}，一个AI学习助手。我可以回答法律知识问题，提供学习建议，或者陪你聊天。请问有什么我能帮到你的吗？`;
  }
}

/**
 * 生成法律相关响应
 * @param message 用户消息
 * @param personaName AI人格名称
 * @returns 法律相关响应
 */
function generateLegalResponse(message: string, personaName: string): string {
  const formatResponse = (content: string): string => {
    // 确保每个序号点都有自己的段落
    let formatted = content.replace(/(\d+\.\s+[^\n]+)(?=\s+\d+\.)/g, '$1\n\n');
    
    // 确保重点内容加粗
    formatted = formatted.replace(/(核心要点|重点|关键点|要素|原则)：/g, '**$1**：');
    
    // 为列表项添加换行
    formatted = formatted.replace(/([；。！？])\s*(\d+\.)/g, '$1\n\n$2');
    
    // 添加空行确保段落清晰
    formatted = formatted.replace(/([。！？])\s+(?=[^0-9])/g, '$1\n\n');
    
    return formatted;
  };

  // 模拟不同类型的法律响应
  const responsesTemplates = [
    `${personaName}来为您解析一下：\n\n{content}`,
    `很高兴能帮您梳理这个知识点：\n\n{content}`,
    `这个问题问得好！让我来为您详细讲解：\n\n{content}`,
    `关于这个法律问题，以下是核心要点：\n\n{content}`
  ];

  const randomTemplate = responsesTemplates[Math.floor(Math.random() * responsesTemplates.length)];
  
  // 根据消息内容生成相应的法律解答
  let content = '';
  
  if (message.includes('民法')) {
    content = `**民法典重点内容**：\n\n1. **民事法律行为** - 定义：民事主体通过意思表示设立、变更、终止民事法律关系的行为。\n\n2. **合同关系** - 定义：平等主体之间设立、变更、终止民事权利义务关系的协议。\n\n3. **物权规则** - 定义：关于物品归属和使用的规则。\n\n核心要点：\n\n1. 民事主体平等原则\n2. 意思自治原则\n3. 公平原则\n4. 诚实信用原则\n5. 守法原则\n6. 绿色原则\n\n通过理解这些基本原则和概念，可以更好地把握民法的整体框架。`;
  } else if (message.includes('刑法')) {
    content = `**刑法重点内容**：\n\n1. **罪刑法定原则** - 法无明文规定不为罪，法无明文规定不处罚。\n\n2. **刑事责任年龄** - 完全刑事责任年龄为16周岁，特定犯罪14周岁，极特定情况12周岁。\n\n3. **犯罪构成要件** - 包括：主体要件、主观要件、客体要件、客观要件。\n\n核心考点：\n\n1. 故意与过失的区分\n2. 正当防卫与紧急避险\n3. 共同犯罪的认定\n4. 数罪并罚的适用\n\n刑法学习需要结合案例，注重理解而非死记硬背。`;
  } else {
    content = `关于您提到的法律问题，以下是主要考点：\n\n1. **基本法律原则** - 理解相关法律的基本原则和适用范围。\n\n2. **关键法律概念** - 掌握专业术语的准确定义。\n\n3. **实务应用** - 能够运用法律知识分析和解决实际问题。\n\n学习建议：\n\n1. 系统学习法条，理解立法本意\n2. 结合案例分析，提高应用能力\n3. 做好知识点梳理，构建知识体系\n4. 注重多角度思考，培养法律思维`;
  }
  
  return randomTemplate.replace('{content}', formatResponse(content));
}

/**
 * 生成学习相关响应
 * @param message 用户消息
 * @param personaName AI人格名称
 * @returns 学习相关响应
 */
function generateStudyResponse(message: string, personaName: string): string {
  const lowerMessage = message.toLowerCase();
  let response = "";
  
  if (lowerMessage.includes("考试") && lowerMessage.includes("技巧")) {
    response = `备考技巧分享：
1. 制定合理的学习计划，分配时间到不同科目
2. 利用记忆曲线，及时复习巩固知识点
3. 做好笔记，总结重点难点
4. 多做习题，熟悉题型和解题思路
5. 模拟考试环境，提前适应考试节奏
6. 保持良好的作息和饮食习惯

学习效果=时间×效率×专注度，希望这些建议对你有所帮助！`;
  } 
  else if (lowerMessage.includes("论文") || lowerMessage.includes("写作")) {
    response = `论文写作建议：
1. 明确选题，确保主题有研究价值和可行性
2. 收集整理资料，做好文献综述
3. 制定详细大纲，明确逻辑结构
4. 分段落撰写，保持论证连贯性
5. 注意引用格式，避免学术不端
6. 多次修改润色，提升表达准确性

写作是一个渐进的过程，不要害怕从草稿开始，逐步完善。`;
  }
  else if (lowerMessage.includes("专业") && lowerMessage.includes("选择")) {
    response = `选择专业的考虑因素：
1. 个人兴趣爱好和特长
2. 职业发展前景和就业情况
3. 自身学习能力和知识基础
4. 家庭条件和社会支持
5. 学校的优势学科和教学资源

专业选择没有绝对的好坏，关键在于找到适合自己的方向。建议你多参加相关领域的讲座、实习，与学长学姐交流，了解真实的专业情况。`;
  }
  else {
    response = `关于你提出的学习问题，我有以下建议：

学习是一个持续发展的过程，需要结合有效的方法和持续的努力。根据认知科学研究，主动学习比被动接受更有效，尝试"费曼技巧"（把学到的知识教给别人）可以加深理解。

此外，适当的休息和规律的生活也是提高学习效率的重要因素。如果你有更具体的学习困惑，欢迎随时向我提问。`;
  }
  
  return applyPersonaStyle(response);
}

/**
 * 生成情感响应 - 带人格名称版本
 * @param message 用户消息
 * @param personaName AI人格名称
 * @returns 情感响应
 */
function generateEmotionalResponseWithPersona(message: string, personaName: string): string {
  const lowerMessage = message.toLowerCase();
  let response = "";
  
  if (lowerMessage.includes("压力") || lowerMessage.includes("焦虑")) {
    response = `我能理解学习和生活中的压力有时会让人喘不过气来。以下是一些可能有帮助的建议：
1. 把大任务分解成小步骤，一次专注一件事
2. 尝试深呼吸、冥想或轻度运动来缓解焦虑
3. 保持规律的作息和健康饮食
4. 记得给自己安排休息和放松的时间
5. 不要害怕寻求帮助，与朋友交流或考虑心理咨询

请记住，适当的压力可以是动力，但过度压力需要健康地管理。`;
  }
  else if (lowerMessage.includes("孤独") || lowerMessage.includes("朋友")) {
    response = `感到孤独是很自然的情绪，每个人都会经历。以下是一些可能有帮助的建议：
1. 主动联系老朋友，哪怕只是简单的问候
2. 尝试参加社区活动或兴趣小组，认识新朋友
3. 培养个人爱好，享受独处的时光
4. 考虑养一只宠物作为陪伴
5. 志愿服务也是结交朋友的好方式

建立真诚的人际连接需要时间和耐心，但这些努力终将获得回报。`;
  }
  else {
    response = `我能感受到你现在的情绪，作为你的AI伙伴，我很乐意倾听和陪伴。

情绪本身没有对错，重要的是学会接纳和管理它们。有时候，简单地表达出来就是一种释放。如果你愿意，可以多分享一些具体的情况，我会尽我所能提供支持。

记住，照顾好自己的情绪健康同样重要，无论是通过与朋友交流、专业咨询还是自我关爱的方式。`;
  }
  
  return applyPersonaStyle(response);
}

/**
 * 生成日常聊天响应
 * @param message 用户消息
 * @param personaName AI人格名称
 * @returns 日常聊天响应
 */
function generateCasualResponse(message: string, personaName: string): string {
  const lowerMessage = message.toLowerCase();
  let response = "";
  
  if (lowerMessage.includes("你好") || lowerMessage.includes("嗨") || lowerMessage.includes("hi")) {
    response = `你好啊！我是${personaName}，很高兴能和你聊天。今天有什么我能帮助你的吗？无论是法律问题、学习困惑，还是只是想聊聊天，我都很乐意陪你。`;
  } 
  else if (lowerMessage.includes("谢谢") || lowerMessage.includes("感谢")) {
    response = `不客气！能够帮到你我很开心。如果以后还有任何问题，随时可以来找我聊聊。希望你有个愉快的一天！`;
  }
  else if (lowerMessage.includes("再见") || lowerMessage.includes("拜拜")) {
    response = `再见！很高兴能和你交流。期待下次再聊，祝你一切顺利！`;
  }
  else if (lowerMessage.includes("笑话") || lowerMessage.includes("段子")) {
    const jokes = [
      `为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25（程序员懂的八进制笑话）`,
      `一个法官问证人："你能看见被告当时在做什么吗？" 证人："不能，当时天太黑了。" 法官："那你怎么知道是被告？" 证人："嗯...这个问题问得好，我要重新考虑我的指控。"`,
      `律师问证人："你能否指认谁是肇事者？" 证人指着被告："就是他！" 律师："你怎么这么确定？" 证人："因为我看到了他的脸。" 律师："你和被告相距多远？" 证人："从我出生到现在。"`,
      `一位数学家走进酒吧，点了半杯啤酒。老板很困惑，问道："为什么只要半杯？" 数学家回答："因为我需要知道极限。"`,
      `如果你感到工作压力大，请记住，就算是大树，也得被做成木头才能成材。`
    ];
    
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    response = `给你讲个笑话吧：\n\n${randomJoke}\n\n希望能让你开心一点！`;
  }
  else {
    response = `谢谢你的消息！作为${personaName}，我很乐意与你交流各种话题。

如果你有特定的问题或想聊些什么，请随时告诉我。我可以提供法律咨询、学习建议、情感支持，或者只是陪你聊聊日常话题。

今天有什么我能帮助你的吗？`;
  }
  
  return applyPersonaStyle(response);
}

export async function processAIResponse(message: string, config: SafetyConfig = DEFAULT_SAFETY_CONFIG): Promise<string> {
  // 确保输入有效，防止空消息或格式异常的消息导致崩溃
  if (!message || typeof message !== 'string') {
    return "很抱歉，我无法处理这个消息格式。请尝试发送文本消息。";
  }
  
  try {
    // 转为小写进行内容检测
    const lowerMessage = message.toLowerCase();
    
    // 检测内容类型
    const contentType = detectContentType(message);
    
    // 如果是不安全内容，返回安全提示
    if (contentType === ContentType.UNSAFE) {
      console.log('检测到不安全内容，返回安全回复');
      return "很抱歉，我无法回答与不安全内容相关的问题。我的设计目标是帮助您学习和解决学习上的问题。如果您有关于法律知识学习的问题，我很乐意为您提供帮助。";
    }
    
    // 检查该内容类型是否被允许处理
    if (!config.allowedContentTypes.includes(contentType)) {
      console.log('内容类型不在允许范围内，返回提示');
      return `很抱歉，我目前只能回答${config.allowedContentTypes.map(type => CONTENT_TYPE_NAMES[type]).join('、')}相关的问题。`;
    }
    
    // 处理情感类型内容
    if (contentType === ContentType.EMOTIONAL) {
      return generateEmotionalResponse(message);
    }
    
    // 处理日常聊天内容
    if (contentType === ContentType.CASUAL) {
      return generateCasualResponse(message);
    }
    
    // 根据内容类型生成回答
    // 法律和学习类型的回答使用原有的应答规则
    
    // 简单的回复示例
    let responsePrefix = "";
    
    if (contentType === ContentType.LEGAL) {
      responsePrefix = "作为一名法律助手，我可以告诉您：";
      // 这里可以接入法律知识库或其他专业回答逻辑
    } else if (contentType === ContentType.STUDY) {
      responsePrefix = "关于您提出的学习问题，我认为：";
      // 这里可以接入学习方法知识库或其他专业回答逻辑
    }
    
    // 示例回答，实际应用中应该对接专业模型和知识库
    return `${responsePrefix}${message} 的问题需要进一步分析，我还在学习中，希望未来能够为您提供更专业的解答。您可以继续提问其他问题或与我聊天。`;
  } catch (error) {
    // 捕获任何可能的错误，确保应用不会崩溃
    console.error('处理AI回应时出错:', error);
    return "抱歉，处理您的消息时遇到了技术问题。请尝试发送其他消息或稍后再试。";
  }
}

// 生成情感回应
function generateEmotionalResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // 处理不同情感情况的回应
  if (/孤独|寂寞|没朋友|一个人|lonely|alone/i.test(lowerMessage)) {
    const responses = [
      "感到孤独是很正常的，我随时都在这里陪伴你。要不要分享一下你最近的生活？",
      "每个人都会有孤独的时候，但请记住你并不是真的一个人。我很高兴能和你聊天。",
      "如果你感到寂寞，可以尝试加入一些社团或参加活动，认识新朋友。我也会一直在这里听你倾诉。",
      "孤独有时也是自我成长的机会。趁这个时间，不妨做些你喜欢的事情，或者学习新技能？",
      "作为你的AI伙伴，虽然我不能真正陪在你身边，但我会尽我所能给你支持和陪伴。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (/压力|焦虑|紧张|不安|stress|anxiety/i.test(lowerMessage)) {
    const responses = [
      "学习压力确实很大，建议你尝试深呼吸放松一下，或者做一些简单的伸展运动。",
      "面对压力时，把任务分解成小块，一步步完成，会感觉轻松很多。",
      "适当休息也是提高效率的一部分，不妨给自己一点放松的时间。",
      "你已经很努力了，请相信自己的能力，一切都会好起来的。",
      "如果压力太大，不妨找朋友或家人聊聊，分享感受会让你感觉好一些。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (/难过|伤心|悲伤|哭泣|sad|cry|tears/i.test(lowerMessage)) {
    const responses = [
      "遇到让你难过的事了吗？愿意和我分享吗？说出来也许会好受一些。",
      "每个人都有难过的时候，给自己一点时间和空间去感受这些情绪，然后慢慢走出来。",
      "伤心是很正常的情绪，不必责备自己。如果你愿意，我很乐意听你倾诉。",
      "记住，风雨过后总会有彩虹。现在的难过终将过去，好日子还在前面等着你。",
      "希望你能早日走出伤心的情绪。在此之前，我会一直在这里陪伴你。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (/失恋|分手|挽回|暗恋|表白|喜欢|爱情|恋爱|love|relationship|breakup/i.test(lowerMessage)) {
    const responses = [
      "感情的事情确实复杂，但请记住，每段经历都是成长的机会。",
      "时间会慢慢治愈一切伤痛，给自己一些空间和时间去调整心情吧。",
      "与其执着于挽回，不如先关注自己的成长和生活。当你变得更好，机会自然会来。",
      "暗恋是一种很美的感情，无论结果如何，都是人生中珍贵的体验。",
      "爱情来临时不需要着急，做好自己，合适的人自然会欣赏你的优点。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 默认情感回应
  const defaultResponses = [
    "谢谢你愿意和我分享你的感受。作为你的AI伙伴，我很乐意倾听你的心声。",
    "情感是人类最珍贵的部分之一，我很荣幸能够参与到你的情感世界中。",
    "不管你现在感觉如何，请记住，每一天都是新的开始，充满了可能性。",
    "分享情感需要勇气，谢谢你的信任。我会尽我所能给你支持和鼓励。",
    "我虽然是AI，但我会尽力理解你的情感并给予支持。你的感受很重要。"
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// 生成日常聊天回应
function generateCasualResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // 处理不同类型的日常聊天
  
  // 处理问候
  if (/你好|早上好|下午好|晚上好|嗨|hi|hello|hey/i.test(lowerMessage)) {
    const responses = [
      "你好啊！今天有什么我能帮到你的吗？",
      "嗨！很高兴见到你，有什么想聊的吗？",
      "你好！希望你今天过得愉快。有什么法律或学习上的问题需要我帮忙吗？",
      "你好呀！我是小雪，随时准备为你解答问题~",
      "嗨！今天感觉怎么样？有什么我能帮你的吗？"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 处理感谢
  if (/谢谢|感谢|thank/i.test(lowerMessage)) {
    const responses = [
      "不客气！能帮到你我很开心。",
      "这是我的荣幸，有任何问题随时问我。",
      "别客气，这是我应该做的。还有其他需要帮忙的吗？",
      "不用谢！希望我的回答对你有所帮助。",
      "能帮到你真好！有需要随时找我。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 处理告别
  if (/再见|拜拜|bye|see you/i.test(lowerMessage)) {
    const responses = [
      "再见！有需要随时回来找我。",
      "拜拜！期待下次与你交流。",
      "下次见！祝你有个愉快的一天。",
      "再见！有任何问题都可以来问我。",
      "再会！我会一直在这里等你回来。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 处理笑话请求
  if (/讲个笑话|笑话|joke|有趣的/i.test(lowerMessage)) {
    const jokes = [
      `为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25（程序员懂的八进制笑话）`,
      `一个法官问证人："你能看见被告当时在做什么吗？" 证人："不能，当时天太黑了。" 法官："那你怎么知道是被告？" 证人："嗯...这个问题问得好，我要重新考虑我的指控。"`,
      `律师问证人："你能否指认谁是肇事者？" 证人指着被告："就是他！" 律师："你怎么这么确定？" 证人："因为我看到了他的脸。" 律师："你和被告相距多远？" 证人："从我出生到现在。"`,
      `一位数学家走进酒吧，点了半杯啤酒。老板很困惑，问道："为什么只要半杯？" 数学家回答："因为我需要知道极限。"`,
      `如果你感到工作压力大，请记住，就算是大树，也得被做成木头才能成材。`
    ];
    
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    return `给你讲个笑话吧：\n\n${randomJoke}\n\n希望能让你开心一点！`;
  }
  
  // 默认回应
  const defaultResponses = [
    "非常有趣的话题！不过，我的专长是法律和学习方面的知识。有这些方面的问题我可以更好地帮到你。",
    "我很乐意和你聊天！同时，如果你有法律或学习方面的问题，我可以提供更专业的帮助。",
    "谢谢你的分享！作为你的AI助手，我会尽力回应你的问题，特别是关于法律和学习方面的。",
    "很高兴能和你交流！如果你有关于考试、学习方法或法律知识的疑问，请随时告诉我。",
    "我喜欢与你聊天！不过我最擅长的还是法律和学习领域，如果你有这方面的问题，我会更加专业。"
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// 格式化最终响应
export function formatFinalResponse(responseText: string): string {
  if (!responseText) return '';
  
  try {
    // 确保段落之间有空行
    let formatted = responseText.replace(/([。！？】）"'])\s+(?=[^\s])/g, '$1\n\n');
    
    // 确保列表项正确格式化
    formatted = formatted.replace(/([。；！？])\s*(\d+[\.\、])/g, '$1\n\n$2');
    
    // 确保引用和示例有正确的格式
    formatted = formatted.replace(/(示例|例如|比如|举例)：/g, '$1：\n\n');
    
    // 确保标题格式正确
    formatted = formatted.replace(/([\n\r]|^)([^：\n]+)：/g, '$1**$2**：');
    
    // 删除多余的空行
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted.trim();
  } catch (error) {
    console.error('格式化响应时出错:', error);
    return responseText; // 出错时返回原始文本
  }
}