import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 读取最近的日志文件
function getRecentLogs() {
  try {
    // 创建日志目录（如果不存在）
    const logDir = path.join(process.cwd(), 'data', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      return ["日志系统初始化成功，尚无处理记录"];
    }
    
    // 查找最新的日志文件
    const files = fs.readdirSync(logDir)
      .filter(file => file.endsWith('.log'))
      .sort((a, b) => {
        try {
          // 根据文件修改时间排序
          return fs.statSync(path.join(logDir, b)).mtime.getTime() - 
                 fs.statSync(path.join(logDir, a)).mtime.getTime();
        } catch (err) {
          return 0;
        }
      });
    
    // 如果没有日志文件
    if (files.length === 0) {
      return ["尚无PDF处理记录"];
    }
    
    // 读取最近的日志文件
    const latestLog = fs.readFileSync(path.join(logDir, files[0]), 'utf8');
    return latestLog.split('\n').filter(line => line.trim());
    
  } catch (error) {
    console.error('读取日志出错:', error);
    return ["读取日志出错: " + error.message];
  }
}

// 同时检查处理输出目录，获取最近处理的文件
function getRecentProcessedFiles() {
  try {
    const pdfDir = path.join(process.cwd(), 'data', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      return ["尚未上传PDF文件"];
    }
    
    // 获取所有JSON结果文件
    const jsonFiles = fs.readdirSync(pdfDir)
      .filter(file => file.endsWith('-tree.json'))
      .sort((a, b) => {
        try {
          return fs.statSync(path.join(pdfDir, b)).mtime.getTime() - 
                 fs.statSync(path.join(pdfDir, a)).mtime.getTime();
        } catch (err) {
          return 0;
        }
      });
    
    if (jsonFiles.length === 0) {
      return [];
    }
    
    // 返回最近的3个文件
    const recentFiles = jsonFiles.slice(0, 3);
    const results = recentFiles.map(file => {
      const filePath = path.join(pdfDir, file);
      const stats = fs.statSync(filePath);
      // 获取对应的txt文件
      const txtFile = file.replace('-tree.json', '.txt');
      const txtPath = path.join(pdfDir, txtFile);
      
      // 检查JSON文件结构
      let nodeCount = "未知";
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        nodeCount = Array.isArray(data) ? data.length : "结构未知";
      } catch (e) {
        nodeCount = "解析错误";
      }
      
      return `[${new Date(stats.mtime).toLocaleString()}] 处理文件: ${file} - 节点数: ${nodeCount}`;
    });
    
    return results;
    
  } catch (error) {
    console.error('获取处理文件出错:', error);
    return ["获取处理文件出错: " + error.message];
  }
}

// 检查处理中的文件
function getProcessingFiles() {
  try {
    const pdfDir = path.join(process.cwd(), 'data', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      return [];
    }
    
    // 获取上传的PDF文件
    const pdfFiles = fs.readdirSync(pdfDir)
      .filter(file => file.endsWith('.pdf'))
      .sort((a, b) => {
        try {
          return fs.statSync(path.join(pdfDir, b)).mtime.getTime() - 
                 fs.statSync(path.join(pdfDir, a)).mtime.getTime();
        } catch (err) {
          return 0;
        }
      });
    
    // 检查哪些PDF没有对应的JSON结果
    const processing = pdfFiles.filter(pdf => {
      const jsonPath = path.join(pdfDir, pdf.replace('.pdf', '-tree.json'));
      return !fs.existsSync(jsonPath);
    });
    
    if (processing.length === 0) {
      return [];
    }
    
    return processing.map(file => {
      const filePath = path.join(pdfDir, file);
      const stats = fs.statSync(filePath);
      const sizeKb = Math.round(stats.size / 1024);
      return `[处理中] ${file} (${sizeKb}KB) - 上传时间: ${new Date(stats.mtime).toLocaleString()}`;
    });
  } catch (error) {
    console.error('获取处理中文件出错:', error);
    return ["获取处理中文件出错: " + error.message];
  }
}

// 明确使用命名导出，这是Next.js API路由所需的格式
export async function GET(request) {
  // 检查并确保数据目录存在
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 创建响应头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  
  try {
    console.log('API请求: 获取处理日志');
    
    // 获取最近的日志
    const logs = getRecentLogs();
    
    // 获取处理中的文件
    const processingFiles = getProcessingFiles();
    
    // 获取最近处理的文件
    const processedFiles = getRecentProcessedFiles();
    
    // 组合日志
    const combinedLogs = [
      "===== 系统状态 =====",
      `当前时间: ${new Date().toLocaleString()}`,
      `服务器路径: ${process.cwd()}`,
      "",
      processingFiles.length > 0 ? "===== 处理中的文件 =====" : "",
      ...processingFiles,
      processingFiles.length > 0 ? "" : "",
      "===== 最近处理完成文件 =====",
      ...processedFiles,
      "",
      "===== 处理日志 =====",
      ...logs
    ];
    
    // 输出首次响应日志
    console.log('API响应: 成功获取日志, 日志条数:', combinedLogs.length);
    
    // 返回响应，添加跨域头
    return NextResponse.json(
      { logs: combinedLogs },
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error('获取日志出错:', error);
    
    // 错误情况下也要返回有效数据以及跨域头
    return NextResponse.json(
      { 
        error: '获取日志失败', 
        logs: ["系统错误: " + error.message, "请稍后重试或联系管理员"] 
      },
      { status: 500, headers }
    );
  }
} 