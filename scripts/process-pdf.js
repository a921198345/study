const fs = require('fs');
const path = require('path');
const { PDFExtract } = require('pdf.js-extract');
// 不直接从项目根目录导入，修改为相对导入
// const { createClient } = require('@supabase/supabase-js');
// const dotenv = require('dotenv');

// 修改为使用实际的本地路径，避免路径解析问题
// 获取脚本实际所在目录
const SCRIPT_DIR = __dirname;
// 获取项目根目录(避免路径中有空格的问题)
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');

// 安全导入模块，使用绝对路径
const dotenvPath = path.join(PROJECT_ROOT, 'node_modules', 'dotenv');
const supabasePath = path.join(PROJECT_ROOT, 'node_modules', '@supabase/supabase-js');

// 使用require.resolve来确保模块存在，然后导入
let dotenv, createClient;
try {
  dotenv = require('dotenv');
  const supabase = require('@supabase/supabase-js');
  createClient = supabase.createClient;
  console.log('成功加载必要模块');
} catch (err) {
  console.error('模块加载失败:', err.message);
  // 提供降级方案，如果找不到模块直接使用空函数
  dotenv = { config: () => {} };
  createClient = () => ({});
}

// 加载环境变量
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

// Supabase配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 这里有安全检查，但在现有代码库已经有更复杂逻辑的情况下简化处理
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
  console.error('Supabase客户端创建失败:', err.message);
  // 提供空对象作为降级方案
  supabase = { from: () => ({ upsert: () => Promise.resolve() }) };
}

// 日志功能
const LOG_DIR = path.join(PROJECT_ROOT, 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, `pdf-process-${new Date().toISOString().replace(/:/g, '-')}.log`);

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // 写入日志文件
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error(`无法写入日志文件: ${err.message}`);
  }
  
  return logMessage;
}

// 正则表达式，用于识别知识点层级
const REGEX_PATTERNS = {
  level1: /^第[一二三四五六七八九十]+编\s+(.+)$/, // 例如 "第一编 总则"
  level2: /^第[一二三四五六七八九十]+章\s+(.+)$/, // 例如 "第一章 一般规定"
  level3: /^第[一二三四五六七八九十]+节\s+(.+)$/, // 例如 "第一节 民事权利能力和民事行为能力"
  level4: /^([一二三四五六七八九十]+)、\s*(.+)$/, // 例如 "一、自然人的民事权利能力"
  article: /^第([一二三四五六七八九十百]+)条\s+(.+)$/, // 例如 "第一条 为了保护民事主体的合法权益..."
  
  // 优化思维导图模式的正则表达式
  mindmap_title: /^(\d{4})\s*(\S+)思维导图$/, // 匹配标题，如 "2025 民法思维导图"
  mindmap_category: /^([^\s\d:：]{1,8})$/, // 匹配单独的分类标题，如 "物权"、"人身权"
  mindmap_feature: /^([^：]+)[:：](.+)$/, // 匹配特征描述，如 "特征：对世性、特定性"
  mindmap_concept: /^(概念|含义|定义|特点|分类|特征|性质|功能|作用)[:：]?\s*(.+)$/, // 匹配概念描述
  mindmap_point: /^\s*([•·]+|[▪■]+|[\-—]+|[★☆]|[①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/, // 匹配项目符号
  mindmap_keyword: /^([^\s\d（(][^\s:：]{0,10})[:：]\s*(.+)$/, // 匹配关键词描述，如 "形成权：单方意思表示..."
  mindmap_number: /^(\d+)[\.、](.+)$/ // 匹配数字编号，如 "1.物权法定"
};

// PDF提取器实例化
const pdfExtract = new PDFExtract();
const pdfExtractOptions = {};

/**
 * 提取PDF文件内容
 * @param {string} filePath - PDF文件路径
 * @returns {Promise<Array>} - 包含提取的文本行的数组
 */
async function extractPdfContent(filePath) {
  try {
    log(`开始从PDF文件提取内容: ${filePath}`);
    
    // 提取PDF内容
    const data = await pdfExtract.extract(filePath, pdfExtractOptions);
    
    // 检查提取结果
    if (!data || !data.pages || data.pages.length === 0) {
      throw new Error('PDF内容提取失败，无页面内容');
    }
    
    log(`成功提取PDF内容，页数: ${data.pages.length}`);
    
    // 处理提取的文本内容
    const lines = [];
    
    data.pages.forEach((page, pageIndex) => {
      // 合并页面上的文本
      const pageContent = page.content || [];
      
      // 按Y坐标分组，组成行
      const lineGroups = {};
      pageContent.forEach(item => {
        // 四舍五入Y坐标到整数，作为行标识
        const lineY = Math.round(item.y);
        if (!lineGroups[lineY]) {
          lineGroups[lineY] = [];
        }
        lineGroups[lineY].push(item);
      });
      
      // 对每一行内的内容按X坐标排序
      Object.keys(lineGroups).forEach(lineY => {
        lineGroups[lineY].sort((a, b) => a.x - b.x);
        
        // 合并行内文本
        const lineText = lineGroups[lineY]
          .map(item => item.str)
          .join('')
          .trim();
          
        if (lineText) {
          lines.push(lineText);
        }
      });
      
      // 在每页末尾添加页分隔符(如果不是最后一页)
      if (pageIndex < data.pages.length - 1) {
        lines.push('---PAGE_BREAK---');
      }
    });
    
    log(`成功提取文本行，共 ${lines.length} 行`);
    return lines;
  } catch (error) {
    log(`PDF内容提取失败: ${error.message}`, 'ERROR');
    throw new Error(`PDF内容提取失败: ${error.message}`);
  }
}

/**
 * 将提取的内容保存为文本文件
 * @param {string} outputPath - 输出文件路径
 * @param {Array} lines - 文本行数组 
 */
function saveContentToFile(outputPath, lines) {
  try {
    log(`开始保存文本内容到: ${outputPath}`);
    fs.writeFileSync(outputPath, lines.join('\n'));
    log(`成功保存文本内容，大小: ${fs.statSync(outputPath).size} 字节`);
    return true;
  } catch (error) {
    log(`保存文本内容失败: ${error.message}`, 'ERROR');
    throw new Error(`保存文本内容失败: ${error.message}`);
  }
}

/**
 * 解析知识树结构
 * @param {Array} lines - 文本行数组
 * @returns {Array} - 知识树节点数组
 */
function parseKnowledgeTree(lines) {
  try {
    log('开始解析知识树结构');
    
    const knowledgeTree = [];
    let currentLevel = 0;
    let currentParentStack = [null];
    let nodeId = 1;
    
    // 正则表达式匹配章节编号
    const sectionRegex = /^(\d+(\.\d+)*)\s+(.+)$/;
    
    lines.forEach((line, index) => {
      // 跳过页分隔符
      if (line === '---PAGE_BREAK---') {
        return;
      }
      
      // 判断行是否为章节标题
      const match = line.match(sectionRegex);
      if (match) {
        const sectionNumber = match[1];
        const sectionTitle = match[3].trim();
        
        // 通过点号数量确定级别
        const level = sectionNumber.split('.').length;
        
        // 调整父级堆栈
        if (level > currentLevel) {
          // 深入层级
          currentParentStack.push(knowledgeTree[knowledgeTree.length - 1]?.id || null);
        } else if (level < currentLevel) {
          // 返回上级
          const levelsToGoUp = currentLevel - level;
          for (let i = 0; i < levelsToGoUp + 1; i++) {
            currentParentStack.pop();
          }
          currentParentStack.push(knowledgeTree[knowledgeTree.length - 1]?.id || null);
        }
        
        // 当前父级
        const parentId = currentParentStack[currentParentStack.length - 2];
        
        // 创建节点
        const node = {
          id: nodeId++,
          title: sectionTitle,
          sectionNumber,
          level,
          parentId,
          content: '',
          children: []
        };
        
        knowledgeTree.push(node);
        currentLevel = level;
      } else if (line.trim() && knowledgeTree.length > 0) {
        // 如果不是标题且不为空，添加到最后一个节点的内容中
        const lastNode = knowledgeTree[knowledgeTree.length - 1];
        if (lastNode) {
          if (lastNode.content) {
            lastNode.content += '\n' + line;
          } else {
            lastNode.content = line;
          }
        }
      }
    });
    
    // 建立父子关系
    knowledgeTree.forEach(node => {
      if (node.parentId) {
        const parent = knowledgeTree.find(n => n.id === node.parentId);
        if (parent && !parent.children.includes(node.id)) {
          parent.children.push(node.id);
        }
      }
    });
    
    log(`成功解析知识树结构，共 ${knowledgeTree.length} 个节点`);
    return knowledgeTree;
  } catch (error) {
    log(`解析知识树结构失败: ${error.message}`, 'ERROR');
    throw new Error(`解析知识树结构失败: ${error.message}`);
  }
}

/**
 * 扁平化知识树
 * @param {Array} tree - 知识树
 * @returns {Array} - 扁平化的知识树数组
 */
function flattenKnowledgeTree(tree) {
  return tree.map(node => {
    const { id, title, sectionNumber, level, parentId, content, children } = node;
    return { id, title, sectionNumber, level, parentId, content, children };
  });
}

/**
 * 保存知识树到JSON文件
 * @param {string} outputPath - 输出文件路径
 * @param {Array} tree - 知识树
 */
function saveKnowledgeTree(outputPath, tree) {
  try {
    log(`开始保存知识树到: ${outputPath}`);
    const flatTree = flattenKnowledgeTree(tree);
    fs.writeFileSync(outputPath, JSON.stringify(flatTree, null, 2));
    log(`成功保存知识树，节点数: ${flatTree.length}`);
    return true;
  } catch (error) {
    log(`保存知识树失败: ${error.message}`, 'ERROR');
    throw new Error(`保存知识树失败: ${error.message}`);
  }
}

/**
 * 处理PDF文件
 * @param {string} pdfPath - PDF文件路径
 * @returns {Object} - 处理结果
 */
async function processPdf(pdfPath) {
  try {
    log(`开始处理PDF文件: ${pdfPath}`);
    
    // 确保PDF文件存在
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF文件不存在: ${pdfPath}`);
    }
    
    // 创建输出目录
    const fileBaseName = path.basename(pdfPath, path.extname(pdfPath));
    const txtOutputPath = pdfPath.replace(/\.pdf$/i, '.txt');
    const jsonOutputPath = pdfPath.replace(/\.pdf$/i, '.json');
    
    // 提取PDF内容
    const lines = await extractPdfContent(pdfPath);
    
    // 保存文本内容
    saveContentToFile(txtOutputPath, lines);
    
    // 解析知识树
    const knowledgeTree = parseKnowledgeTree(lines);
    
    // 保存知识树
    saveKnowledgeTree(jsonOutputPath, knowledgeTree);
    
    log(`PDF处理完成: ${pdfPath}`);
    
    // 返回结果
    return {
      success: true,
      pdfPath,
      txtOutputPath,
      outputPath: jsonOutputPath,
      nodeCount: knowledgeTree.length,
      message: `成功处理PDF文件，共提取 ${lines.length} 行文本，生成 ${knowledgeTree.length} 个知识节点`
    };
  } catch (error) {
    log(`PDF处理失败: ${error.message}`, 'ERROR');
    return {
      success: false,
      pdfPath,
      error: error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 获取命令行参数
    const args = process.argv.slice(2);
    if (args.length < 1) {
      throw new Error('请提供PDF文件路径');
    }
    
    const pdfPath = args[0];
    const result = await processPdf(pdfPath);
    
    // 将结果输出为JSON字符串
    console.log(JSON.stringify(result));
    
    // 根据成功或失败设置退出码
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    log(`程序执行失败: ${error.message}`, 'ERROR');
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
}

// 执行主函数
main(); 