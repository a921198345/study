const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local')
});

// 获取命令行参数
const args = process.argv.slice(2);
const queryIndex = args.indexOf('--query');
const query = queryIndex !== -1 ? args[queryIndex + 1] : null;

if (!query) {
  console.error('请提供要搜索的查询，例如: node scripts/test-knowledge-search.js --query "什么是民法"');
  process.exit(1);
}

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('环境变量中缺少Supabase配置信息');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 搜索知识库
 * @param {string} query - 用户查询
 * @param {number} limit - 返回结果数量限制
 * @returns {Promise<Array>} - 搜索结果
 */
async function searchKnowledge(query, limit = 5) {
  try {
    console.log(`正在搜索: "${query}"`);
    
    // 使用基本的模糊匹配搜索
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select(`
        id,
        title,
        content,
        chapter_id
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('搜索知识库时出错:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('搜索知识库时发生异常:', error);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 搜索知识库
    const results = await searchKnowledge(query);
    
    if (results.length === 0) {
      console.log('未找到相关知识点');
      return;
    }
    
    console.log(`找到 ${results.length} 条相关知识点:\n`);
    
    // 显示搜索结果（简化版本）
    results.forEach((item, index) => {
      console.log(`[${index + 1}] ${item.title}`);
      console.log('----------------------------');
      console.log(item.content.substring(0, 150) + (item.content.length > 150 ? '...' : ''));
      console.log('');
    });
    
  } catch (error) {
    console.error('执行搜索时发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 