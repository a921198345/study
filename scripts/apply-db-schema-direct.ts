import { loadEnv } from './load-env';

// 先加载环境变量
loadEnv();

// 确保环境变量加载后再导入supabase客户端
import { supabaseAdmin } from '../lib/supabase';

async function applyDbSchema() {
  try {
    console.log('开始创建数据库表...');
    console.log(`当前Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // 1. 创建subjects表
    console.log('创建subjects表...');
    let { error: subjectsError } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .limit(1);
      
    if (subjectsError && subjectsError.code === 'PGRST301') {
      const { error } = await supabaseAdmin.rpc('create_table', {
        table_name: 'subjects',
        columns: `
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        `
      });
      
      if (error) {
        console.error('创建subjects表时出错:', error);
        // 如果rpc方法不可用，则可能需要手动在Supabase控制台创建表
        console.log('请在Supabase控制台手动创建表');
      } else {
        console.log('✅ subjects表创建成功');
      }
    } else if (!subjectsError) {
      console.log('✅ subjects表已存在');
    }
    
    // 2. 创建chapters表
    console.log('创建chapters表...');
    let { error: chaptersError } = await supabaseAdmin
      .from('chapters')
      .select('id')
      .limit(1);
      
    if (chaptersError && chaptersError.code === 'PGRST301') {
      const { error } = await supabaseAdmin.rpc('create_table', {
        table_name: 'chapters',
        columns: `
          id SERIAL PRIMARY KEY,
          subject_id INTEGER,
          title TEXT NOT NULL,
          order_number INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        `
      });
      
      if (error) {
        console.error('创建chapters表时出错:', error);
        console.log('请在Supabase控制台手动创建表');
      } else {
        console.log('✅ chapters表创建成功');
      }
    } else if (!chaptersError) {
      console.log('✅ chapters表已存在');
    }
    
    // 3. 创建knowledge_entries表
    console.log('创建knowledge_entries表...');
    let { error: entriesError } = await supabaseAdmin
      .from('knowledge_entries')
      .select('id')
      .limit(1);
      
    if (entriesError && entriesError.code === 'PGRST301') {
      const { error } = await supabaseAdmin.rpc('create_table', {
        table_name: 'knowledge_entries',
        columns: `
          id SERIAL PRIMARY KEY,
          chapter_id INTEGER,
          title TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
        `
      });
      
      if (error) {
        console.error('创建knowledge_entries表时出错:', error);
        console.log('请在Supabase控制台手动创建表');
      } else {
        console.log('✅ knowledge_entries表创建成功');
      }
    } else if (!entriesError) {
      console.log('✅ knowledge_entries表已存在');
    }
    
    console.log('数据库表创建完成');
    console.log('注意：向量功能和全文搜索索引需要在Supabase控制台的SQL编辑器中手动添加');
  } catch (error) {
    console.error('创建数据库表时发生错误:', error);
  }
}

// 执行函数
applyDbSchema(); 