import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: '请上传PDF文件' },
        { status: 400 }
      );
    }
    
    // 创建目录
    const uploadDir = path.join(process.cwd(), 'data', 'pdfs');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // 生成文件名
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    
    // 写入文件
    await writeFile(filePath, Buffer.from(buffer));
    
    // 返回文件路径
    const relativePath = path.join('data', 'pdfs', fileName);
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      filePath: relativePath,
      size: file.size,
    });
    
  } catch (error) {
    console.error('上传PDF出错:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
} 