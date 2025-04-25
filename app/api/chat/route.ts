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

// 模型请求超时控制
async function callDeepSeekWithTimeout(messages: any[], timeout = 30000) {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('DeepSeek API调用超时'));
    }, timeout);

    try {
      const result = await deepseek.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      });
      
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
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
    
    // 4. 检查缓存 - 对常见问题提前返回，减少处理时间
    const cacheKey = query.trim().toLowerCase();
    const cachedEntry = questionCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log('使用缓存回答');
      return NextResponse.json({ answer: cachedEntry.answer }, { headers: corsHeaders });
    }
    
    // 5. 并行执行知识搜索(法律问题)和模型预热 - 设置合理超时
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
      
      // 并行执行知识搜索和模型预热，设置5秒超时
      const knowledgePromise = isLegal ? 
        Promise.race([
          searchKnowledge(correctedQuery),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('知识搜索超时')), 5000))
        ]) : Promise.resolve('');
      
      try {
        knowledgeContext = await knowledgePromise;
        console.log('知识库搜索完成');
      } catch (error) {
        console.warn('知识库搜索超时或出错，继续处理');
        knowledgeContext = '';
      }
      
      if (isLegal) {
        console.log('找到相关知识:', knowledgeContext ? '是' : '否');
      }
    } catch (error) {
      console.error('知识搜索或模型预热失败:', error);
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
    
    // 8. 开始流式传输
    // 创建一个可读流以支持流式响应
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // 立即返回流式响应
    const response = new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
    // 异步处理流式生成
    (async () => {
      try {
        // 开始处理动画
        await writer.write(encoder.encode('data: {"type":"start"}\n\n'));
        
        // 使用DeepSeek API的流式模式
        const completion = await deepseek.chat.completions.create({
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
          temperature: 0.7,
          max_tokens: 1500,
          stream: true, // 启用流式传输
        });
        
        let fullAnswer = '';
        // 处理每个流式片段
        for await (const chunk of completion) {
          // 获取当前片段文本
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullAnswer += content;
            // 将内容包装成JSON并发送
            await writer.write(
              encoder.encode(`data: {"type":"chunk", "content": ${JSON.stringify(content)}}\n\n`)
            );
          }
        }
        
        // 完成处理
        await writer.write(encoder.encode('data: {"type":"end"}\n\n'));
        
        // 缓存完整回答
        if (fullAnswer) {
          questionCache.set(cacheKey, {
            answer: fullAnswer,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        console.error('流式处理出错:', error);
        // 发送错误消息
        let errorMessage = '抱歉，处理你的问题时出现错误。请稍后再试。';
        if (error instanceof Error) {
          if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorMessage = '抱歉，处理这个问题需要的时间太长了。请尝试简化你的问题。';
          }
        }
        
        await writer.write(
          encoder.encode(`data: {"type":"error", "content": ${JSON.stringify(errorMessage)}}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })().catch(console.error);
    
    return response;
    
  } catch (error) {
    console.error('API处理出错:', error);
    return NextResponse.json(
      { answer: '抱歉，服务器处理请求时出现了错误。请稍后再试。' }, 
      { headers: corsHeaders, status: 500 }
    );
  }
} 