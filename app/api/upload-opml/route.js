import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * 处理OPML文件上传的API路由
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'opml') {
      return NextResponse.json(
        { error: '请上传OPML格式的文件' },
        { status: 400 }
      );
    }

    // 确保目录存在
    const opmlDir = path.join(process.cwd(), 'data', 'opml');
    await mkdir(opmlDir, { recursive: true });

    // 生成文件名（使用原始文件名和时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名
    const safeOriginalName = originalName.replace(/[^a-zA-Z0-9]/g, '_'); // 保证文件名安全
    const fileName = `${safeOriginalName}_${timestamp}.opml`;
    const filePath = path.join(opmlDir, fileName);

    // 获取文件数据并写入
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // 返回上传成功的路径
    return NextResponse.json({
      success: true,
      fileName: file.name,
      filePath: filePath,
      size: fileBuffer.length,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('OPML上传错误:', error);
    return NextResponse.json(
      { error: `上传过程中出错: ${error.message}` },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 