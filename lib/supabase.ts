import { createClient } from '@supabase/supabase-js';

// 增强的调试输出
console.log('=== Supabase初始化调试信息 ===');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase URL 长度:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
console.log('Supabase Anon Key 存在:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Supabase Anon Key 长度:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
console.log('Supabase Service Key 存在:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('Node环境:', process.env.NODE_ENV);

// 获取和清理环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim();

// 详细的环境变量检查
if (!supabaseUrl) {
  console.error('Supabase URL 缺失或为空');
}

if (!supabaseAnonKey) {
  console.error('Supabase Anon Key 缺失或为空');
}

if (!supabaseServiceKey) {
  console.warn('Supabase Service Key 缺失或为空 (仅服务端操作需要)');
}

// 声明变量
let supabaseClient = null;
let adminClient = null;

// 创建客户端时使用 try-catch 来捕获可能的错误
try {
  // 使用安全的方式创建客户端 - 客户端
  supabaseClient = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
    
  if (supabaseClient) {
    console.log('✅ 客户端 Supabase 成功初始化');
  } else {
    console.error('❌ 客户端 Supabase 初始化失败: 缺少必要的环境变量');
  }
} catch (error) {
  console.error('❌ 客户端 Supabase 初始化出错:', error);
  supabaseClient = null;
}

// 为服务端操作创建带有完全权限的客户端 - 服务端
try {
  adminClient = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
    
  if (adminClient) {
    console.log('✅ 管理员 Supabase 成功初始化');
  } else {
    console.warn('⚠️ 管理员 Supabase 初始化失败: 缺少必要的环境变量');
  }
} catch (error) {
  console.error('❌ 管理员 Supabase 初始化出错:', error);
  adminClient = null;
}

// 导出客户端实例
export const supabase = supabaseClient;
export const supabaseAdmin = adminClient; 