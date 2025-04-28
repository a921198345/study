import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

// 将exec转为Promise版本
const execPromise = promisify(exec);

// 处理已上传的 OPML 文件
export async function POST(request) {
  try {
    // 解析请求体获取文件路径
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: '未提供文件路径' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: `文件不存在: ${filePath}` },
        { status: 404 }
      );
    }
    
    // 获取文件扩展名
    const fileExt = path.extname(filePath).toLowerCase();
    if (fileExt !== '.opml') {
      return NextResponse.json(
        { error: '请提供OPML格式的文件' },
        { status: 400 }
      );
    }
    
    // 运行OPML处理脚本
    const scriptPath = path.join(process.cwd(), 'scripts', 'process-opml.js');
    
    // 执行脚本并等待结果
    const { stdout, stderr } = await execPromise(`node "${scriptPath}" "${filePath}"`, {
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer
    });
    
    if (stderr) {
      console.error('处理OPML出错:', stderr);
      return NextResponse.json(
        { error: '处理OPML文件时出错: ' + stderr },
        { status: 500 }
      );
    }
    
    try {
      // 解析脚本输出的JSON
      const result = JSON.parse(stdout);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('解析脚本输出失败:', parseError);
      return NextResponse.json(
        { 
          error: '解析处理结果失败',
          stdout: stdout.substring(0, 1000) + (stdout.length > 1000 ? '...' : '')
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('处理OPML API错误:', error);
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    );
  }
} 