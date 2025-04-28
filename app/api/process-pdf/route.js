import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 添加日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  return logMessage;
}

export async function POST(request) {
  try {
    // 解析请求数据
    const data = await request.json();
    const { filePath } = data;

    // 验证数据
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: '未提供文件路径' },
        { status: 400 }
      );
    }
    
    log(`开始处理PDF文件: ${filePath}`);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      const errorMsg = `文件不存在: ${filePath}`;
      log(errorMsg, 'ERROR');
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 404 }
      );
    }

    // 获取项目根目录路径
    const rootDir = path.resolve(process.cwd());
    const scriptPath = path.join(rootDir, 'scripts', 'process-pdf.js');
    
    log(`执行脚本: ${scriptPath} ${filePath}`);

    // 执行PDF处理脚本
    try {
      // 执行PDF处理脚本
      const result = execSync(`node "${scriptPath}" "${filePath}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large PDFs
      });
      
      let jsonResult;
      try {
        jsonResult = JSON.parse(result);
        log(`PDF处理成功完成: ${filePath}`);
      } catch (e) {
        log(`解析脚本输出失败: ${e.message}`, 'ERROR');
        log(`脚本原始输出: ${result.substring(0, 1000)}...`, 'DEBUG');
        jsonResult = { 
          success: false, 
          error: '解析脚本输出失败',
          output: result.substring(0, 1000) // 限制输出大小以避免响应过大
        };
      }

      // 如果处理成功，加载知识树数据
      if (jsonResult.success && jsonResult.outputPath) {
        try {
          const treeData = JSON.parse(fs.readFileSync(jsonResult.outputPath, 'utf8'));
          jsonResult.knowledgeTree = treeData;
          
          // 提取顶级知识点(最多10个)以供预览
          const topLevelNodes = treeData
            .filter(node => !node.parentId)
            .slice(0, 10)
            .map(node => ({
              id: node.id,
              title: node.title,
              level: node.level
            }));
            
          jsonResult.topLevelNodes = topLevelNodes;
        } catch (err) {
          log(`加载知识树数据失败: ${err.message}`, 'WARN');
          // 不中断处理，仅记录警告
        }
      }

      return NextResponse.json(jsonResult);
    } catch (error) {
      log(`执行PDF处理脚本失败: ${error.message}`, 'ERROR');
      
      // 尝试从错误输出中提取JSON (如果有)
      let errorOutput = error.stdout || error.stderr || error.message;
      let jsonError = null;
      
      try {
        // 尝试从错误输出中提取JSON
        const match = errorOutput.match(/(\{.*\})/);
        if (match && match[1]) {
          jsonError = JSON.parse(match[1]);
        }
      } catch (e) {
        // 忽略解析错误
      }
      
      if (jsonError && typeof jsonError === 'object') {
        return NextResponse.json(jsonError, { status: 500 });
      } else {
        return NextResponse.json({
          success: false,
          error: `处理PDF时出错: ${errorOutput || '未知错误'}`
        }, { status: 500 });
      }
    }
  } catch (error) {
    log(`API处理错误: ${error.message || error}`, 'ERROR');
    return NextResponse.json({
      success: false,
      error: `API处理错误: ${error.message || '未知错误'}`
    }, { status: 500 });
  }
} 