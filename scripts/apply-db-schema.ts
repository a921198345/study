import fs from 'fs';
import path from 'path';
import { loadEnv } from './load-env';

// 先加载环境变量
loadEnv();

// 确保环境变量加载后再导入supabase客户端
import { supabaseAdmin } from '../lib/supabase';

async function applyDbSchema() {
  try {
    console.log('开始应用数据库架构...');
    console.log(`当前Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // 读取SQL文件
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'create-db-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // 执行SQL脚本
    const { error } = await supabaseAdmin.rpc('pgmoon.query', { query: sqlContent });
    
    if (error) {
      console.error('执行SQL脚本时出错:', error);
      
      // 尝试分段执行SQL
      console.log('尝试分段执行SQL...');
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim() + ';';
        console.log(`执行SQL语句 ${i+1}/${statements.length}`);
        
        const { error: stmtError } = await supabaseAdmin.rpc('pgmoon.query', { query: stmt });
        if (stmtError) {
          console.error(`SQL语句 ${i+1} 执行错误:`, stmtError);
        }
      }
    } else {
      console.log('✅ SQL脚本执行成功');
    }
    
    console.log('数据库架构应用完成');
  } catch (error) {
    console.error('应用数据库架构时发生错误:', error);
  }
}

// 执行函数
applyDbSchema(); 