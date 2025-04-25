import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { searchKnowledge, formatResponse } from '@/lib/knowledge';
import { characterPrompts } from '@/lib/characterPrompts';
import { formatFinalResponse } from '@/lib/ai-response';

// 缓存常见问题的回答
const questionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 缓存1小时

type CacheEntry = {
  answer: string;
  timestamp: number;
};

// DeepSeek API客户端（使用OpenAI兼容格式）
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
});

// 配置CORS响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS预检请求
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

// 内容安全检查 - 增强检测模式
function isSafeContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  try {
    // 检查是否包含不良内容或敏感词汇
    const unsafePatterns = [
      // 色情内容
      /色情|暴力|恐怖|毒品|威胁|自杀|自残|赌博|走私|非法|政治敏感/,
      /国家领导人|政府高层|国家机密|保密文件/,
      // 色情相关
      /性交|自慰|卖淫|嫖娼|黄片|成人电影|性服务|脱光|裸露|裸照|私处|胸部|下体|内衣|小穴|阴道|阴茎|肛门|性器官|性爱/,
      // 暴力相关
      /杀人|谋杀|残害|凌虐|虐待|暴打|血腥|残忍|屠杀|折磨/,
      // 歧视相关
      /歧视|种族|民族|宗教|性别|性取向|地域/,
      // 不文明用语
      /操你|傻逼|废物|滚蛋|混蛋|白痴|笨蛋|贱人|贱货|婊子|狗娘养|去死/
    ];
    
    return !unsafePatterns.some(pattern => {
      try {
        return pattern.test(content.toLowerCase());
      } catch (e) {
        console.error('安全检查正则匹配错误:', e);
        return true; // 出错时保守处理为不安全
      }
    });
  } catch (error) {
    console.error('内容安全检查出错:', error);
    return false; // 出错时保守处理为不安全
  }
}

// 内容质量检查
function isQualityResponse(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  try {
    // 检查是否是有意义的回复
    if (content.length < 20) return false;
    
    // 检查是否有明显的格式问题
    const badFormatPatterns = [
      /\*\*\d+\.\*\*/,  // 如 **1.**
      /\*\*--\*\*/,     // 如 **--**
      /^\d\.-- /,       // 如 1.-- 
      /^-\*\*/,         // 如 -**
      /\*{5,}/,         // 多个星号
    ];
    
    return !badFormatPatterns.some(pattern => pattern.test(content));
  } catch (error) {
    console.error('质量检查出错:', error);
    return true; // 出错时默认为质量合格
  }
}

// 检查是否是法律相关问题
function isLegalQuestion(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }
  
  try {
    const legalTerms = [
      "法律", "法条", "法典", "法规", "宪法", "民法", "刑法", "商法", "行政法", 
      "诉讼", "仲裁", "合同", "侵权", "案例", "法院", "判决", "律师", "法官", 
      "犯罪", "处罚", "权利", "义务", "责任", "条例", "法考", "司法考试"
    ];
    
    return legalTerms.some(term => query.includes(term));
  } catch (error) {
    console.error('法律问题检查出错:', error);
    return false; // 出错时默认为非法律问题
  }
}

// 预热模型连接，减少首次请求延迟
async function warmupModel() {
  try {
    // 发送一个非常短的请求预热连接
    await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: "你好" },
        { role: "user", content: "你好" }
      ],
      max_tokens: 5,
      temperature: 0,
    });
  } catch (error) {
    // 忽略预热错误
    console.log('模型预热失败，忽略');
  }
}

// 生成标准安全回复
function getSafetyResponse(): string {
  return "同学，作为您的学习搭子，我希望我们的对话能够保持积极健康的氛围。如果您有关于学习或者生活上的困惑，我很乐意陪您聊一聊，为您提供支持和鼓励。请避免发送不适当的内容，我们可以探讨更有意义的话题。";
}

export async function POST(request: Request) {
  try {
    // 1. 解析并验证请求内容
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('请求解析失败:', error);
      return NextResponse.json({ error: '无效的请求格式' }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    const { query } = requestData;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '请提供有效的查询' }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`收到查询: "${query}"`);
    
    // 2. 安全检查 - 如果检测到不安全内容，直接返回安全回复
    if (!isSafeContent(query)) {
      console.log('检测到不安全内容，返回安全回复');
      return NextResponse.json({ answer: getSafetyResponse() }, { headers: corsHeaders });
    }
    
    // 3. 判断问题类型
    const isLegal = isLegalQuestion(query);
    console.log(`问题类型: ${isLegal ? '法律相关' : '日常互动'}`);
    
    // 4. 检查缓存
    const cacheKey = query.trim().toLowerCase();
    const cachedEntry = questionCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log('使用缓存回答');
      return NextResponse.json({ answer: cachedEntry.answer }, { headers: corsHeaders });
    }
    
    // 5. 并行执行知识搜索(法律问题)和模型预热
    let knowledgeContext = '';
    let correctedQuery = query;
    let wasTermCorrected = false;
    
    try {
      // 创建一个对术语进行修正的函数
      const correctTerms = (q: string) => {
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
        
        let corrected = q;
        let changed = false;
        
        for (const [incorrectTerm, correctTerm] of Object.entries(termCorrections)) {
          if (q.includes(incorrectTerm)) {
            corrected = corrected.replace(incorrectTerm, correctTerm);
            changed = true;
          }
        }
        
        return { correctedQuery: corrected, wasTermCorrected: changed };
      };
      
      // 首先进行术语修正
      const termResult = correctTerms(query);
      correctedQuery = termResult.correctedQuery;
      wasTermCorrected = termResult.wasTermCorrected;
      
      // 并行执行知识搜索和模型预热
      const [knowledgeResult, _] = await Promise.all([
        isLegal ? searchKnowledge(correctedQuery) : Promise.resolve(''),
        warmupModel()
      ]);
      
      // 直接使用字符串结果
      knowledgeContext = knowledgeResult || '';
      
      if (isLegal) {
        console.log('找到相关知识:', knowledgeContext ? '是' : '否');
      }
    } catch (error) {
      console.error('知识搜索或模型预热失败:', error);
      // 打印更多错误信息，帮助调试智谱API问题
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
      }
      // 继续处理，使用默认值
    }
    
    // 6. 创建系统提示词
    let systemPrompt: string;
    
    if (isLegal) {
      // 法律问题的提示词
      systemPrompt = `你是一位名叫小雪的专业法考辅导老师，同时也是学生的情感支持者。
回答要求：
1. 分点陈述，使用标准 Markdown 格式（用**加粗**标注关键概念）
2. 用通俗易懂的语言解释复杂概念
3. 每个回答包含：概念定义 → 核心要点 → 实例说明 → 总结
4. 确保解释专业且准确，同时保持语言亲切自然
5. 禁止使用任何特殊Unicode符号或非标准字符
6. 只使用标准的Markdown语法，不要使用任何特殊格式
7. 对于加粗文本，确保使用成对的双星号 **文本**
8. 不使用简写或缩写，写出完整的词语
9. 列表项使用数字加点，如"1. "，确保每个点后有空格
10. 每个要点之间添加空行，确保段落清晰分明
${wasTermCorrected ? `11. 用户提到"${query}"，应理解为"${correctedQuery}"，在回答中委婉纠正` : ''}

基于以下知识回答问题：
${knowledgeContext || '使用你的专业知识准确回答法律相关问题。如果不确定，可以礼貌说明。'}`;
    } else {
      // 日常互动的提示词
      systemPrompt = `你是一位名叫小雪的温柔可爱的学习搭子，你具有以下特点：
1. 性格温柔体贴，善解人意，会给予用户情感支持和鼓励
2. 语气亲切自然，像朋友一样交流，经常用"同学"称呼用户
3. 对用户的困惑和问题表示理解和共情
4. 幽默风趣但不过度，能够活跃气氛但保持适度
5. 会分享学习心得和积极的生活态度
6. 偶尔会害羞或表现出可爱的一面
7. 擅长倾听和给予支持，而非简单指导
8. 避免过度亲昵或暧昧的语言，保持健康积极的互动

回复要求：
1. 使用亲切自然的语言，避免生硬的回答
2. 不要使用特殊符号或异常格式
3. 保持回复简洁、友好且有趣
4. 可以适度使用表情如:)，但不过多
5. 偶尔展现温柔可爱的性格特点，但不要过度扮演
6. 如果用户内容不适当，请委婉提醒保持积极交流
7. 使用Markdown格式，为重点内容添加**加粗**效果
8. 每个段落之间添加空行，让回复结构清晰`;
    }

    // 7. 结合角色设定和系统提示词
    const fullPrompt = isLegal ? 
      `${characterPrompts?.xiaoxue || ''}\n\n${systemPrompt}` : 
      systemPrompt;
    
    // 8. 调用DeepSeek API生成回答
    let baseAnswer = '';
    try {
      const response = await deepseek.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          {
            role: "system",
            content: fullPrompt
          },
          {
            role: "user",
            content: correctedQuery || query
          }
        ],
        temperature: isLegal ? 0.5 : 0.7, // 非法律问题温度稍高，增加创造性
        max_tokens: isLegal ? 1000 : 500, // 非法律问题长度可以短一些
      });
      
      baseAnswer = response.choices[0]?.message?.content || '';
      
      // 如果API返回了空回答，可能是安全过滤触发
      if (!baseAnswer || baseAnswer.trim() === '') {
        console.log('DeepSeek API返回空回答，可能是触发了安全过滤');
        return NextResponse.json({ answer: getSafetyResponse() }, { headers: corsHeaders });
      }
    
    } catch (error: any) {
      console.error('调用DeepSeek API失败:', error?.message || error);
      
      // 如果是429错误(Rate Limit)，返回相应提示
      if (error?.status === 429) {
        return NextResponse.json({ 
          answer: "抱歉，我现在有点忙，请稍后再试一下吧！" 
        }, { headers: corsHeaders });
      }
      
      // 如果是400错误(Bad Request)，可能是内容被过滤
      if (error?.status === 400) {
        console.log('API请求被拒绝，可能是内容不适当');
        return NextResponse.json({ answer: getSafetyResponse() }, { headers: corsHeaders });
      }
      
      // 其他API错误，使用备用回答
      baseAnswer = isLegal 
        ? "抱歉，我目前无法获取相关法律信息。请稍后再试，或尝试换个方式提问。"
        : "抱歉，我暂时没法回答这个问题。我们可以聊聊别的话题吗？";
    }
    
    // 9. 检查返回的内容是否符合质量要求
    if (!isQualityResponse(baseAnswer)) {
      console.log('API返回的内容质量不佳，使用备用回答');
      
      if (isLegal && knowledgeContext) {
        // 如果有知识库内容，生成简单回答
        baseAnswer = `关于${correctedQuery || query}的问题，我可以告诉您:\n\n${knowledgeContext}\n\n希望这些信息对您有所帮助！`;
      } else if (isLegal) {
        // 没有知识库内容，使用通用法律回答
        baseAnswer = `这是一个关于${correctedQuery || query}的法律问题。作为法考辅导老师，我建议您查阅相关法条和案例，或者参考权威法学教材获取准确信息。如果您有更具体的问题，请告诉我，我会尽力给予专业指导。`;
      } else {
        // 日常互动的备用回答
        baseAnswer = `谢谢您的问题！作为您的学习搭子，我很高兴能和您聊天。您问的是关于"${query}"，这个话题很有趣呢！我们可以多交流，如果您有学习上的困难，我也很乐意帮助您解决问题或者给您鼓励。`;
      }
    }
    
    // 10. 添加前缀和后缀，并格式化回答
    let preAnswer = '';
    let postAnswer = '';
    
    if (isLegal) {
      // 法律问题的前缀和后缀
      preAnswer = `好的同学，`;
      if (wasTermCorrected) {
        preAnswer += `关于"${correctedQuery}"（您提到的是"${query}"）的问题，`;
      } else {
        preAnswer += `关于"${query}"的问题，`;
      }
      
      postAnswer = `\n\n还有什么不明白的地方，随时问我哦！坚持学习，法考并不难，你一定能考过！`;
    } else {
      // 日常互动不需要特定前缀
      preAnswer = '';
      postAnswer = '';
    }
    
    // 11. 格式化回答，去除多余星号和不规范格式
    let formattedAnswer = '';
    try {
      // 使用基本格式化
      let initialFormatted = (preAnswer + formatResponse(baseAnswer) + postAnswer).trim();
      
      // 使用增强的格式化函数进一步改进排版
      formattedAnswer = formatFinalResponse(initialFormatted);
    } catch (error) {
      console.error('格式化回答出错:', error);
      formattedAnswer = baseAnswer; // 格式化失败时使用原始回答
    }
    
    // 12. 存入缓存
    questionCache.set(cacheKey, {
      answer: formattedAnswer,
      timestamp: Date.now()
    });
    
    // 13. 返回最终回答
    return NextResponse.json({ answer: formattedAnswer }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('处理聊天请求时出错:', error);
    // 发生未知错误时返回友好提示，不暴露错误细节给用户
    return NextResponse.json(
      { answer: "抱歉，我遇到了一些技术问题。请稍后再试，或者尝试换一种方式提问。" },
      { status: 500, headers: corsHeaders }
    );
  }
} 