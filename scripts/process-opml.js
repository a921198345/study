#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { promisify } = require('util');

// 将回调函数转换为Promise
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// 日志路径
const LOG_DIR = path.join(process.cwd(), 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, `opml-process-${new Date().toISOString().replace(/:/g, '-')}.log`);

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  // 使用console.error输出到stderr，避免污染stdout的JSON输出
  console.error(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// 将OPML解析为知识树结构
async function parseOpml(filePath) {
  try {
    log(`开始解析OPML文件: ${filePath}`);
    const opmlContent = await readFile(filePath, 'utf8');
    
    // 使用更合适的解析选项
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      explicitChildren: false,
      mergeAttrs: true    // 将属性合并到对象中
    });
    const result = await promisify(parser.parseString)(opmlContent);
    
    if (!result.opml || !result.opml.body || !result.opml.body.outline) {
      throw new Error('OPML文件格式无效，缺少必要的结构');
    }
    
    log('OPML文件解析成功，开始构建知识树');
    
    // 递归处理outline节点，构建知识树
    function processOutline(outline, level = 1) {
      // 如果只有一个子节点且不是数组，将其转换为数组
      if (outline.outline && !Array.isArray(outline.outline)) {
        outline.outline = [outline.outline];
      }
      
      // 在合并属性的情况下，text属性会被直接放在对象上
      const title = outline.text || '';
      
      const node = {
        id: Math.random().toString(36).substr(2, 9),
        level: level,
        title: title,
        children: []
      };
      
      // 处理属性
      if (outline._) {
        node.content = outline._;
      }
      
      // 处理子节点
      if (outline.outline) {
        for (const childOutline of outline.outline) {
          const childNode = processOutline(childOutline, level + 1);
          node.children.push(childNode);
        }
      }
      
      return node;
    }
    
    let knowledgeTree = [];
    const outlines = Array.isArray(result.opml.body.outline) 
      ? result.opml.body.outline 
      : [result.opml.body.outline];
    
    for (const outline of outlines) {
      knowledgeTree.push(processOutline(outline));
    }
    
    log(`知识树构建完成，共有 ${knowledgeTree.length} 个顶级节点`);
    return knowledgeTree;
  } catch (error) {
    log(`解析OPML文件出错: ${error.message}`);
    throw error;
  }
}

// 展平树结构（用于计数和存储）
function flattenTree(tree) {
  let nodes = [];
  
  function traverse(node) {
    nodes.push({
      id: node.id,
      level: node.level,
      title: node.title,
      content: node.content || '',
      hasChildren: node.children.length > 0
    });
    
    for (const child of node.children) {
      traverse(child);
    }
  }
  
  for (const node of tree) {
    traverse(node);
  }
  
  return nodes;
}

// 保存知识树到JSON文件
async function saveKnowledgeTree(tree, originalFilePath) {
  try {
    // 创建输出目录
    const fileName = path.basename(originalFilePath, path.extname(originalFilePath));
    const outputDir = path.dirname(originalFilePath).replace('/opml', '/json');
    
    if (!fs.existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${fileName}.json`);
    
    // 展平树结构，便于统计和存储
    const flattenedTree = flattenTree(tree);
    
    // 创建完整的输出对象
    const output = {
      meta: {
        fileName: path.basename(originalFilePath),
        processedAt: new Date().toISOString(),
        nodeCount: flattenedTree.length
      },
      tree: tree,
      flatNodes: flattenedTree
    };
    
    // 写入JSON文件
    await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');
    log(`知识树已保存至: ${outputPath}`);
    
    return {
      outputPath,
      nodeCount: flattenedTree.length,
      flattenedTree
    };
  } catch (error) {
    log(`保存知识树出错: ${error.message}`);
    throw error;
  }
}

// 处理OPML文件的主函数
async function processOpml(filePath) {
  try {
    log(`开始处理OPML文件: ${filePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    
    // 解析OPML文件
    const knowledgeTree = await parseOpml(filePath);
    
    // 保存知识树
    const result = await saveKnowledgeTree(knowledgeTree, filePath);
    
    log(`OPML处理完成，共解析 ${result.nodeCount} 个节点`);
    
    return {
      success: true,
      filePath: filePath,
      outputPath: result.outputPath,
      nodeCount: result.nodeCount,
      tree: knowledgeTree,
      flattenedTree: result.flattenedTree
    };
  } catch (error) {
    log(`处理OPML文件失败: ${error.message}`);
    return {
      success: false,
      filePath: filePath,
      error: error.message
    };
  }
}

// 主函数：处理命令行参数
async function main() {
  try {
    // 获取命令行参数中的文件路径
    const filePath = process.argv[2];
    
    if (!filePath) {
      console.error('请提供OPML文件路径');
      process.exit(1);
    }
    
    // 处理OPML文件并获取结果
    const result = await processOpml(filePath);
    
    if (result.success) {
      // 确保只输出纯JSON，不包含任何其他日志
      // 使用process.stdout.write而不是console.log避免额外的换行
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    } else {
      // 错误信息输出到stderr而不是stdout
      console.error(result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error(`处理OPML文件时出错: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行脚本，执行main函数
if (require.main === module) {
  main();
} else {
  // 导出为模块
  module.exports = { processOpml };
} 