import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testConnection() {
  console.log('测试 Supabase 连接...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key存在:', !!SUPABASE_ANON_KEY);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 测试数据库连接
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    console.log('连接成功！');
    console.log('知识条目数量:', data?.[0]?.count || 0);
    
  } catch (error) {
    console.error('连接测试失败:', error);
  }
}

testConnection(); 