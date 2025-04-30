import axios from 'axios';

/**
 * DeepSeekAI类
 * 用于与DeepSeek AI API进行交互
 */
export class DeepSeekAI {
  private apiKey: string;
  private baseURL: string;

  /**
   * 构造函数
   * @param apiKey DeepSeek API密钥
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseURL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
  }

  /**
   * 发送聊天请求给DeepSeek AI
   * @param messages 消息数组
   * @param options 其他选项
   * @returns 返回AI的回复文本
   */
  async chat(messages: any[], options = {}): Promise<string> {
    try {
      if (!this.apiKey) {
        console.warn('未设置DeepSeek API密钥，使用模拟响应');
        return this.mockResponse(messages);
      }

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek AI请求失败:', error);
      return this.mockResponse(messages);
    }
  }

  /**
   * 知识检索
   * @param query 查询内容
   * @param options 其他选项
   * @returns 返回检索结果
   */
  async searchKnowledge(query: string, options = {}): Promise<any> {
    try {
      if (!this.apiKey) {
        console.warn('未设置DeepSeek API密钥，使用模拟响应');
        return this.mockKnowledgeResponse(query);
      }

      const response = await axios.post(
        `${this.baseURL}/knowledge/search`,
        {
          query,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('DeepSeek 知识检索失败:', error);
      return this.mockKnowledgeResponse(query);
    }
  }

  /**
   * 模拟聊天响应（用于API不可用时）
   * @param messages 消息数组
   * @returns 模拟的响应文本
   */
  private mockResponse(messages: any[]): string {
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    if (query.includes('法律') || query.includes('规定') || query.includes('条例')) {
      return '我是AI助手，可以提供一般性的法律信息参考，但具体法律问题请咨询专业律师。法律规定可能因地区和时间而异。';
    }
    
    if (query.includes('考试') || query.includes('题目') || query.includes('答案')) {
      return '我可以帮助你复习和理解考试相关概念，但我不能直接提供具体考试的答案。学习过程中理解知识点比记忆答案更重要。';
    }

    return '我是AI考试助手，可以帮助你复习备考和回答学习相关问题。有什么我可以帮助你的吗？';
  }

  /**
   * 模拟知识检索响应（用于API不可用时）
   * @param query 查询内容
   * @returns 模拟的知识检索结果
   */
  private mockKnowledgeResponse(query: string): any[] {
    // 模拟一些基本法律知识返回
    const mockData = [
      {
        title: '法律基础知识',
        content: '法律是由国家制定或认可的，由国家强制力保证实施的规范人们行为的规则总和。',
        relevance: 0.95
      },
      {
        title: '考试须知',
        content: '参加考试前，请确保充分休息，携带必要的文具和证件。遵守考场纪律，不得携带通讯设备。',
        relevance: 0.9
      },
      {
        title: '学习方法指南',
        content: '有效的学习方法包括：制定计划、专注学习、定期复习、善用记忆技巧、保持健康的作息。',
        relevance: 0.85
      }
    ];

    // 根据查询内容筛选相关结果
    return mockData.filter(item => 
      item.title.includes(query) || 
      item.content.includes(query)
    ).slice(0, 2);
  }
} 