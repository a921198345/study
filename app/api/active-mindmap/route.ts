import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 从Supabase获取活跃的思维导图数据 (复制自mindmap-data API)
async function getActiveMindMapFromSupabase() {
  try {
    console.log('从Supabase获取活跃思维导图数据');
    
    // 检查 supabase 客户端是否可用
    if (!supabaseAdmin && !supabase) {
      console.error('Supabase 客户端未初始化，可能是环境变量缺失');
      throw new Error('数据库连接失败，请检查环境配置');
    }
    
    // 优先使用 supabaseAdmin，如果不可用则使用 supabase
    const client = supabaseAdmin || supabase;
    
    // 显式检查确保client不为null (TypeScript类型安全)
    if (!client) {
      throw new Error('无法初始化Supabase客户端');
    }
    
    // 查询活跃的思维导图
    const { data, error } = await client
      .from('mindmaps')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('查询活跃思维导图失败:', error);
      return null;
    }
    
    if (!data) {
      console.warn('未找到活跃的思维导图数据');
      return null;
    }
    
    console.log(`找到活跃思维导图: ${data.file_name}`);
    return data;
  } catch (error: unknown) {
    console.error('获取思维导图数据失败:', error);
    return null;
  }
}

// API路由处理函数 - 获取活跃思维导图数据
export async function GET() {
  try {
    console.log('active-mindmap: 开始获取活跃思维导图...');
    
    // 调用现有函数获取活跃思维导图
    const activeFile = await getActiveMindMapFromSupabase();
    
    if (!activeFile || !activeFile.id) {
      console.error('未找到活跃的思维导图');
      
      // 尝试回退策略：返回默认思维导图数据
      console.log('使用默认思维导图数据');
      return NextResponse.json({
        nodeData: {
          id: 'root',
          topic: '请上传思维导图数据',
          expanded: true,
          children: [
            {
              id: 'sub1',
              topic: '您可以选择导入一个JSON文件',
              expanded: true,
            },
            {
              id: 'sub2',
              topic: '或者从API获取思维导图数据',
              expanded: true,
            }
          ]
        }
      });
    }
    
    // 获取思维导图数据
    console.log(`获取ID=${activeFile.id}的思维导图数据`);
    const apiUrl = `/api/mindmap-data?id=${activeFile.id}`;
    
    // 获取绝对URL
    const host = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const fullApiUrl = `${protocol}://${host}${apiUrl}`;
    
    console.log(`请求思维导图数据: ${fullApiUrl}`);
    const response = await fetch(fullApiUrl);
    
    if (!response.ok) {
      throw new Error(`思维导图数据API返回错误: ${response.status}`);
    }
    
    // 获取JSON数据
    const data = await response.json();
    
    // 返回数据
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('获取活跃思维导图数据失败:', error);
    return NextResponse.json(
      { error: `获取活跃思维导图数据失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 