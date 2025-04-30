import { DeepSeekAI } from './deepseek-ai';

// 初始化DeepSeekAI客户端
const aiClient = new DeepSeekAI();

/**
 * 向AI发送对话请求
 * @param messages 对话历史
 * @param options 对话选项
 * @returns AI回复内容
 */
export async function sendMessage(messages: any[], options = {}): Promise<string> {
  try {
    // 使用DeepSeekAI进行对话
    return await aiClient.chat(messages, options);
  } catch (error) {
    console.error('AI对话请求失败:', error);
    return '抱歉，我暂时无法回答您的问题。请稍后再试。';
  }
} 