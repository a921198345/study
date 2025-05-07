import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 从Supabase获取思维导图文件列表
async function getFileListFromSupabase() {
  try {
    // 检查supabaseAdmin是否为null
    if (!supabaseAdmin) {
      console.error('supabaseAdmin未初始化，可能是环境变量缺失');
      return { files: [], error: '数据库连接未初始化' };
    }
    
    // 查询所有思维导图文件
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('查询文件列表失败:', error);
      return { files: [], error: error.message };
    }
    
    // 转换为前端需要的格式
    const files = data.map(item => ({
      id: item.id,
      name: item.file_name,
      uploadDate: item.created_at,
      nodesCount: item.nodes_count || 0,
      isActive: item.is_active || false
    }));
    
    return { files, error: null };
  } catch (error) {
    console.error('获取文件列表异常:', error);
    return { files: [], error: (error as Error).message };
  }
}

// 获取默认文件列表（用于数据库连接失败时）
function getDefaultFiles() {
  return [
    {
      id: 'simple-mindmap.json',
      name: '思维导图示例',
      uploadDate: '2023-10-13T01:46:40.000Z',
      nodesCount: 3,
      isActive: true
    }
  ];
}

export async function GET() {
  console.log('获取思维导图文件列表');
  
  try {
    // 从Supabase获取文件列表
    const { files, error } = await getFileListFromSupabase();
    
    if (error || !files || files.length === 0) {
      console.log('未获取到文件列表或发生错误，返回默认列表');
      return NextResponse.json({ 
        files: getDefaultFiles(),
        message: '使用默认文件列表 - 未找到已上传文件或发生错误',
        error: error
      });
    }
    
    console.log(`找到 ${files.length} 个文件`);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    // 发生错误时返回默认文件列表
    return NextResponse.json({ 
      files: getDefaultFiles(),
      error: '获取文件列表失败，显示默认文件',
      details: (error as Error).message
    });
  }
} 