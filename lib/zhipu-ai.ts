import axios from 'axios';
import * as crypto from 'crypto';

export class ZhipuAI {
  private apiUrl = 'https://open.bigmodel.cn/api/paas/v4';
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    // 从环境变量读取智谱AI的API密钥
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    this.apiSecret = process.env.ZHIPU_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('智谱AI API密钥未设置，请在环境变量中配置ZHIPU_API_KEY和ZHIPU_API_SECRET');
    }
  }

  // 生成JWT令牌
  private generateToken(): string {
    const payload = {
      api_key: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      timestamp: Math.floor(Date.now() / 1000)
    };

    return this.createJwtToken(payload, this.apiSecret);
  }

  // 创建JWT令牌
  private createJwtToken(payload: any, secret: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const base64UrlEncode = (str: string): string => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };
    
    const headerStr = base64UrlEncode(JSON.stringify(header));
    const payloadStr = base64UrlEncode(JSON.stringify(payload));
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${headerStr}.${payloadStr}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `${headerStr}.${payloadStr}.${signature}`;
  }

  // 模拟知识检索API调用
  public async searchKnowledge(query: string): Promise<string> {
    // 如果未配置API密钥，使用模拟数据
    if (!this.apiKey || !this.apiSecret) {
      console.log('使用模拟数据进行知识检索');
      return this.simulateKnowledgeSearch(query);
    }

    try {
      const token = this.generateToken();
      
      const response = await axios.post(
        `${this.apiUrl}/embeddings/knowledge-search`,
        {
          query: query,
          knowledge_id: process.env.ZHIPU_KNOWLEDGE_ID || '', // 知识库ID
          top_k: 3, // 返回前3个最相关的结果
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // 处理API响应
      if (response.data.success) {
        // 合并所有检索结果
        const context = response.data.data.map((item: any) => {
          return `${item.title || '知识点'}:\n${item.content}`;
        }).join('\n\n');
        
        return context;
      } else {
        console.error('智谱AI知识检索失败:', response.data.message);
        return '';
      }
    } catch (error) {
      console.error('智谱AI知识检索请求失败:', error);
      // 出错时使用模拟数据
      return this.simulateKnowledgeSearch(query);
    }
  }

  // 模拟知识检索结果
  private simulateKnowledgeSearch(query: string): string {
    const legalKnowledgeDatabase: Record<string, string> = {
      '刑事责任年龄': `
        刑事责任年龄是指法律规定的可以追究行为人刑事责任的最低年龄界限。
        
        中国《刑法》规定的刑事责任年龄分为三个阶段：
        1. 已满16周岁的人，应当负刑事责任
        2. 已满14周岁不满16周岁的人，犯故意杀人、故意伤害致人重伤或者死亡、强奸、抢劫、贩卖毒品、放火、爆炸、投放危险物质罪的，应当负刑事责任
        3. 已满12周岁不满14周岁的人，犯故意杀人、故意伤害罪，致人死亡或者以特别残忍手段致人重伤造成严重残疾，情节恶劣，经最高人民检察院核准追诉的，应当负刑事责任

        根据2021年1月1日起施行的刑法修正案（十一），12周岁以上不满14周岁的未成年人，犯故意杀人、故意伤害罪致人死亡或以特别残忍手段致人重伤造成严重残疾，情节恶劣的，经最高人民检察院核准追诉的，应当负刑事责任。
      `,
      '离婚': `
        离婚是指夫妻双方或一方依照法定程序解除婚姻关系的法律行为。

        中国《民法典》规定的离婚方式有两种：
        1. 协议离婚：夫妻双方自愿离婚的，应当签订离婚协议，并亲自到婚姻登记机关申请离婚登记
        2. 诉讼离婚：如果夫妻双方协商不成的，可以向人民法院提起离婚诉讼

        离婚的法定条件：
        1. 双方感情确已破裂
        2. 调解无效
        3. 符合法定离婚情形之一

        法定离婚情形包括：
        1. 重婚或者与他人同居
        2. 实施家庭暴力或者虐待、遗弃家庭成员
        3. 有赌博、吸毒等恶习屡教不改
        4. 因感情不和分居满二年
        5. 其他导致夫妻感情破裂的情形
      `,
      '合同效力': `
        合同效力是指合同在法律上的约束力和法律后果。

        根据《民法典》，合同的效力分为以下几种情况：
        1. 有效合同：完全符合法律规定的合同，对当事人具有法律约束力
        2. 无效合同：违反法律强制性规定或者违背公序良俗的合同无效
        3. 可撤销合同：因重大误解、显失公平、欺诈、胁迫等情形订立的合同，受损害方有权请求法院或者仲裁机构撤销
        4. 效力待定合同：无权处分人处分他人财产、限制民事行为能力人订立的合同等，效力取决于有权追认人是否追认

        无效合同的情形包括：
        1. 一方以欺诈、胁迫的手段订立合同，损害国家利益
        2. 恶意串通，损害国家、集体或者第三人利益
        3. 以合法形式掩盖非法目的
        4. 损害社会公共利益
        5. 违反法律、行政法规的强制性规定
      `,
      '物权': `
        物权是指权利人依法对特定物享有的排他的直接支配和利用的权利。

        《民法典》规定的物权类型主要包括：
        1. 所有权：所有权人对自己的不动产或者动产，依法享有占有、使用、收益和处分的权利
        2. 用益物权：用益物权人对他人所有的不动产或者动产，依法享有占有、使用和收益的权利，包括土地承包经营权、建设用地使用权、宅基地使用权和地役权
        3. 担保物权：为了确保债权的实现，债权人对债务人或者第三人的特定物享有的优先受偿的权利，包括抵押权、质权和留置权

        物权的特征：
        1. 直接支配性：物权人可以直接支配标的物
        2. 排他性：同一物上不能同时并存性质相同、内容相同的两个物权
        3. 客体特定性：物权的客体是特定的物
        4. 公示性：物权的设立、变更、转让和消灭，应当遵守公示原则
      `,
      '继承权': `
        继承权是指自然人依法取得被继承人遗产的权利。

        《民法典》规定的继承方式有两种：
        1. 法定继承：被继承人没有遗嘱的，按照法定继承办理
        2. 遗嘱继承：被继承人有遗嘱的，按照遗嘱继承办理

        法定继承人的顺序：
        1. 第一顺序：配偶、子女、父母
        2. 第二顺序：兄弟姐妹、祖父母、外祖父母

        遗嘱的形式：
        1. 公证遗嘱：经公证机构证明的遗嘱
        2. 自书遗嘱：由遗嘱人亲笔书写，签名，注明年、月、日
        3. 代书遗嘱：由他人代书，有两个以上见证人在场见证，由代书人、见证人签名，注明年、月、日
        4. 录音录像遗嘱：以录音录像形式立的遗嘱，有两个以上见证人在场见证
        5. 口头遗嘱：遗嘱人在危急情况下，可以立口头遗嘱，有两个以上见证人在场见证
      `,
      '婚姻': `
        婚姻是指男女双方依照法律规定的条件和程序结为夫妻关系的法律行为。

        《民法典》规定的结婚条件：
        1. 男女双方完全自愿
        2. 男女双方均已达到法定婚龄（男不得早于22周岁，女不得早于20周岁）
        3. 双方均无配偶（即无重婚的情形）
        4. 双方不属于直系血亲或者三代以内的旁系血亲
        5. 双方均无法定禁止结婚的疾病

        婚姻关系存续期间的权利义务：
        1. 夫妻平等原则：夫妻在婚姻家庭中地位平等
        2. 夫妻财产制度：夫妻可以约定婚姻关系存续期间所得的财产以及婚前财产归各自所有、共同所有或者部分各自所有、部分共同所有；约定应当采用书面形式；没有约定或者约定不明确的，适用法定共同财产制
        3. 家庭成员间的扶养义务：夫妻有相互扶养的义务；父母对子女有抚养义务，子女对父母有赡养义务
      `
    };
    
    // 简单关键词匹配
    for (const [keyword, content] of Object.entries(legalKnowledgeDatabase)) {
      if (query.includes(keyword)) {
        return content;
      }
    }
    
    // 如果没有找到匹配项，返回空字符串
    return '';
  }
  
  // 调用智谱GLM大模型进行对话
  public async chat(messages: any[], options: any = {}): Promise<string> {
    // 如果未配置API密钥，使用模拟数据
    if (!this.apiKey || !this.apiSecret) {
      console.log('未配置智谱API密钥，使用模拟回复');
      return '这是一个模拟回复，请配置智谱API密钥以获取真实回复。';
    }
    
    try {
      const token = this.generateToken();
      
      const defaultOptions = {
        model: 'glm-4',  // 使用GLM-4模型
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      };
      
      const requestOptions = { ...defaultOptions, ...options };
      
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: requestOptions.model,
          messages: messages,
          temperature: requestOptions.temperature,
          top_p: requestOptions.top_p,
          max_tokens: requestOptions.max_tokens
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        console.error('智谱AI响应格式错误:', response.data);
        return '抱歉，获取回复时出现错误。';
      }
    } catch (error) {
      console.error('调用智谱AI聊天API失败:', error);
      return '抱歉，调用AI服务失败，请稍后再试。';
    }
  }
} 