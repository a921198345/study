import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取文件ID
    const reqData = await request.json();
    const fileId = reqData.fileId;
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, message: '缺少文件ID' },
        { status: 400 }
      );
    }
    
    console.log(`请求删除文件: ${fileId}`);
    
    // 检查supabaseAdmin是否为null
    if (!supabaseAdmin) {
      console.error('supabaseAdmin未初始化，可能是环境变量缺失');
      return NextResponse.json(
        { success: false, message: '服务器配置错误：数据库连接未初始化' },
        { status: 500 }
      );
    }
    
    // 首先检查文件是否为活跃状态
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('mindmaps')
      .select('is_active')
      .eq('id', fileId)
      .single();
    
    if (fileError) {
      console.error('查询文件状态失败:', fileError);
      return NextResponse.json(
        { success: false, message: '查询文件状态失败', details: fileError.message },
        { status: 500 }
      );
    }
    
    // 如果文件不存在
    if (!fileData) {
      return NextResponse.json(
        { success: false, message: '文件不存在或已被删除' },
        { status: 404 }
      );
    }
    
    // 不允许删除活跃文件
    if (fileData.is_active) {
      return NextResponse.json(
        { success: false, message: '不能删除当前活跃的文件，请先设置其他文件为活跃' },
        { status: 400 }
      );
    }
    
    // 执行删除操作
    const { error: deleteError } = await supabaseAdmin
      .from('mindmaps')
      .delete()
      .eq('id', fileId);
    
    if (deleteError) {
      console.error('删除文件失败:', deleteError);
      return NextResponse.json(
        { success: false, message: '删除文件失败', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `文件 ${fileId} 已成功删除`
    });
  } catch (error) {
    console.error('处理删除请求失败:', error);
    return NextResponse.json(
      { success: false, message: '处理删除请求失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 