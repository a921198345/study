import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { stat, readFile } from 'fs/promises';

/**
 * 处理下载请求的API路由
 * 接受查询参数path，返回指定路径的文件内容
 */
export async function GET(request) {
  try {
    // 从URL中获取文件路径
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');
    
    // 验证路径
    if (!filePath) {
      return NextResponse.json(
        { error: '未提供文件路径' },
        { status: 400 }
      );
    }
    
    // 安全验证：确保只能下载data目录下的文件
    const absolutePath = resolve(process.cwd(), filePath);
    const workspacePath = resolve(process.cwd());
    
    // 确保文件路径在workspace内且包含data目录
    if (!absolutePath.startsWith(workspacePath) || 
        !absolutePath.includes('/data/') ||
        !absolutePath.includes('/pdfs/')) {
      return NextResponse.json(
        { error: '无效的文件路径' },
        { status: 403 }
      );
    }
    
    try {
      // 检查文件是否存在
      const fileStats = await stat(absolutePath);
      
      if (!fileStats.isFile()) {
        return NextResponse.json(
          { error: '请求的路径不是文件' },
          { status: 400 }
        );
      }
      
      // 文件大小限制检查（限制为10MB）
      if (fileStats.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '文件太大，无法下载' },
          { status: 400 }
        );
      }
      
      // 读取文件内容
      const fileContent = await readFile(absolutePath);
      
      // 获取文件名
      const fileName = basename(absolutePath);
      
      // 设置响应头
      const headers = new Headers();
      headers.set('Content-Disposition', `attachment; filename=${fileName}`);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('Content-Length', fileStats.size.toString());
      
      // 返回文件内容
      return new NextResponse(fileContent, {
        status: 200,
        headers
      });
      
    } catch (error) {
      // 文件不存在或无法访问
      return NextResponse.json(
        { error: `文件不存在或无法访问: ${error.message}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('下载文件时出错:', error);
    return NextResponse.json(
      { error: `处理请求时出错: ${error.message}` },
      { status: 500 }
    );
  }
} 