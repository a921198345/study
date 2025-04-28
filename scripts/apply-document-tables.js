const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 环境变量获取
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function applyDocumentTables() {
  console.log('开始创建文档数据库表结构...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('错误: 缺少 Supabase 环境变量，请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  // 初始化 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // 创建文档块表
    console.log('创建 document_chunks 表...');
    
    const { error: createChunksTableError } = await supabase.rpc('exec_sql', {
      query: `
        -- 文档块表
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          content TEXT NOT NULL,                      -- 文档块内容
          metadata JSONB NOT NULL,                    -- 元数据（标题、页码等）
          subject TEXT NOT NULL,                      -- 学科分类
          filename TEXT NOT NULL,                     -- 文件名
          filetype TEXT NOT NULL,                     -- 文件类型
          hash TEXT NOT NULL,                         -- 文件哈希值（用于去重）
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createChunksTableError) {
      console.error('创建 document_chunks 表失败:', createChunksTableError);
    } else {
      console.log('document_chunks 表创建成功');
    }
    
    // 创建索引
    console.log('创建索引...');
    
    const { error: createIndexError } = await supabase.rpc('exec_sql', {
      query: `
        -- 创建索引以提高搜索性能
        CREATE INDEX IF NOT EXISTS document_chunks_subject_idx ON document_chunks (subject);
        CREATE INDEX IF NOT EXISTS document_chunks_hash_idx ON document_chunks (hash);
      `
    });
    
    if (createIndexError) {
      console.error('创建索引失败:', createIndexError);
    } else {
      console.log('索引创建成功');
    }
    
    // 创建文档任务表
    console.log('创建 document_tasks 表...');
    
    const { error: createTasksTableError } = await supabase.rpc('exec_sql', {
      query: `
        -- 文档处理任务表（用于跟踪上传和处理状态）
        CREATE TABLE IF NOT EXISTS document_tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          filename TEXT NOT NULL,
          filetype TEXT NOT NULL,
          filesize INTEGER NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',     -- pending, processing, completed, failed
          hash TEXT NOT NULL,                         -- 文件哈希值
          error TEXT,                                 -- 错误信息（如果有）
          chunks_count INTEGER DEFAULT 0,             -- 生成的块数量
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE
        );
      `
    });
    
    if (createTasksTableError) {
      console.error('创建 document_tasks 表失败:', createTasksTableError);
    } else {
      console.log('document_tasks 表创建成功');
    }
    
    // 创建视图
    console.log('创建文档摘要视图...');
    
    const { error: createViewError } = await supabase.rpc('exec_sql', {
      query: `
        -- 创建视图来聚合文档信息
        CREATE OR REPLACE VIEW document_summary AS
        SELECT
          hash,
          MAX(filename) AS filename,
          MAX(filetype) AS filetype,
          MAX(subject) AS subject,
          COUNT(*) AS chunks_count,
          MIN(created_at) AS uploaded_at
        FROM document_chunks
        GROUP BY hash
        ORDER BY MIN(created_at) DESC;
      `
    });
    
    if (createViewError) {
      console.error('创建视图失败:', createViewError);
    } else {
      console.log('文档摘要视图创建成功');
    }
    
    console.log('文档数据库表结构创建完成！');
  } catch (error) {
    console.error('创建文档数据库表时出错:', error);
    process.exit(1);
  }
}

// 直接运行
if (require.main === module) {
  applyDocumentTables()
    .then(() => {
      console.log('数据库表创建脚本执行完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('数据库表创建脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { applyDocumentTables }; 