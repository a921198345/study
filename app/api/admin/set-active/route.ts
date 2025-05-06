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
    
    console.log(`设置活跃文件: ${fileId}`);
    
    // 首先验证文件是否存在
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('mindmaps')
      .select('id')
      .eq('id', fileId)
      .single();
    
    if (fileError || !fileData) {
      console.error('文件不存在:', fileError);
      return NextResponse.json(
        { success: false, message: '指定的文件不存在' },
        { status: 404 }
      );
    }
    
    // 更新活跃状态：先将所有文件设为非活跃
    const { error: resetError } = await supabaseAdmin
      .from('mindmaps')
      .update({ is_active: false })
      .neq('id', 'dummy');
    
    if (resetError) {
      console.error('重置活跃状态失败:', resetError);
      return NextResponse.json(
        { success: false, message: '重置文件活跃状态失败', details: resetError.message },
        { status: 500 }
      );
    }
    
    // 将指定文件设为活跃
    const { error: updateError } = await supabaseAdmin
      .from('mindmaps')
      .update({ is_active: true })
      .eq('id', fileId);
    
    if (updateError) {
      console.error('设置活跃文件失败:', updateError);
      return NextResponse.json(
        { success: false, message: '设置活跃文件失败', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `文件 ${fileId} 已设置为活跃状态`
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json(
      { success: false, message: '处理请求失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 