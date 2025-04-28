const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// Supabase配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('错误: 缺少Supabase配置。请确保.env.local文件中包含NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_KEY或NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 配置参数
const DEFAULT_SUBJECT = '通用'; // 默认学科分类
const CHUNK_SIZE = 1000; // 每个知识块的大小（字符数）

/**
 * 处理文本文件，将其分块上传到知识库
 */
async function processFile(filePath, subject = DEFAULT_SUBJECT) {
  try {
    console.log(`开始处理文件: ${filePath}`);
    
    // 读取文件
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const fileTitle = path.basename(filePath, path.extname(filePath));
    
    // 计算文件哈希值，用于去重
    const hash = crypto.createHash('md5').update(fileContent).digest('hex');
    
    // 获取科目ID
    const subjectId = await ensureSubjectExists(subject);
    if (!subjectId) {
      console.error('无法获取学科ID，无法继续上传');
      return;
    }
    
    // 检查是否存在相同标题的知识条目
    const { data: existingEntries } = await supabase
      .from('knowledge_entries')
      .select('id')
      .eq('title', fileTitle)
      .limit(1);
    
    if (existingEntries && existingEntries.length > 0) {
      console.log(`标题为"${fileTitle}"的知识条目已存在，跳过上传`);
      return;
    }
    
    // 获取默认章节ID或创建新章节
    const chapterId = await getDefaultChapter(subjectId, subject);
    if (!chapterId) {
      console.error('无法获取章节ID，无法继续上传');
      return;
    }
    
    // 将文本分块
    const chunks = splitTextIntoChunks(fileContent, fileTitle);
    console.log(`文件已分割为${chunks.length}个知识块`);
    
    // 上传每个知识块
    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const entryData = {
        chapter_id: chapterId,
        title: chunk.title,
        content: chunk.content
      };
      
      const { error } = await supabase
        .from('knowledge_entries')
        .insert(entryData);
      
      if (error) {
        console.error(`上传知识块 "${chunk.title}" 失败:`, error);
        continue;
      }
      
      successCount++;
      console.log(`知识块 "${chunk.title}" 上传成功 (${successCount}/${chunks.length})`);
    }
    
    console.log(`文件处理完成，成功上传 ${successCount}/${chunks.length} 个知识块`);
    
  } catch (error) {
    console.error(`处理文件失败: ${filePath}`, error);
  }
}

/**
 * 获取默认章节ID，如果不存在则创建
 */
async function getDefaultChapter(subjectId, subject) {
  // 查找默认章节
  const chapterTitle = `${subject}基础知识`;
  
  const { data: existingChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('title', chapterTitle)
    .maybeSingle();
  
  if (existingChapter) {
    console.log(`使用已有章节: "${chapterTitle}", ID: ${existingChapter.id}`);
    return existingChapter.id;
  }
  
  // 创建新章节
  const { data: newChapter, error } = await supabase
    .from('chapters')
    .insert({
      subject_id: subjectId,
      title: chapterTitle,
      order_number: 1
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`创建章节失败:`, error);
    return null;
  }
  
  console.log(`已创建新章节: "${chapterTitle}", ID: ${newChapter.id}`);
  return newChapter.id;
}

/**
 * 将文本分割成合适大小的块
 */
function splitTextIntoChunks(text, title) {
  const chunks = [];
  let currentPosition = 0;
  
  while (currentPosition < text.length) {
    // 确定当前块的结束位置
    let endPosition = Math.min(currentPosition + CHUNK_SIZE, text.length);
    
    // 如果不是在文本末尾，尝试在句子或段落结束处截断
    if (endPosition < text.length) {
      const possibleEndChars = ['.', '。', '!', '！', '?', '？', '\n', '\r\n'];
      
      // 从理想位置向后查找100字符范围内的句子结束符
      for (let i = 0; i < 100; i++) {
        if (endPosition + i >= text.length) break;
        
        if (possibleEndChars.includes(text[endPosition + i])) {
          endPosition = endPosition + i + 1;
          break;
        }
      }
    }
    
    // 提取当前块的文本
    const chunkText = text.slice(currentPosition, endPosition);
    
    // 创建一个带有标题前缀的块
    const chunkWithTitle = {
      content: chunkText,
      title: `${title} - 第${chunks.length + 1}部分`
    };
    
    chunks.push(chunkWithTitle);
    
    // 更新位置
    currentPosition = endPosition;
  }
  
  return chunks;
}

/**
 * 创建知识条目分类
 */
async function ensureSubjectExists(subject) {
  // 检查学科是否存在
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', subject)
    .maybeSingle();
  
  if (existingSubject) {
    console.log(`学科 "${subject}" 已存在，ID: ${existingSubject.id}`);
    return existingSubject.id;
  }
  
  // 创建新学科
  const { data: newSubject, error } = await supabase
    .from('subjects')
    .insert({ name: subject, description: `${subject}相关知识` })
    .select('id')
    .single();
  
  if (error) {
    console.error(`创建学科 "${subject}" 失败:`, error);
    return null;
  }
  
  console.log(`已创建学科 "${subject}"，ID: ${newSubject.id}`);
  return newSubject.id;
}

/**
 * 处理目录中的所有TXT文件
 */
async function processDirectory(directoryPath, subject = DEFAULT_SUBJECT) {
  try {
    // 读取目录中的所有文件
    const files = fs.readdirSync(directoryPath);
    
    // 筛选出所有TXT文件
    const txtFiles = files.filter(file => path.extname(file).toLowerCase() === '.txt');
    
    console.log(`找到 ${txtFiles.length} 个TXT文件需要处理`);
    
    // 处理每个文件
    for (const file of txtFiles) {
      const filePath = path.join(directoryPath, file);
      await processFile(filePath, subject);
    }
    
    console.log('所有文件处理完成');
    
  } catch (error) {
    console.error('处理目录失败:', error);
  }
}

/**
 * 处理单个文件
 */
async function handleSingleFile(filePath, subject = DEFAULT_SUBJECT) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`错误: 文件不存在 - ${filePath}`);
      return;
    }
    
    // 检查文件类型
    if (path.extname(filePath).toLowerCase() !== '.txt') {
      console.error(`错误: 只支持TXT文件 - ${filePath}`);
      return;
    }
    
    await processFile(filePath, subject);
    
  } catch (error) {
    console.error('处理文件失败:', error);
  }
}

// 主执行函数
async function main() {
  const args = process.argv.slice(2);
  
  // 检查参数
  if (args.length < 1) {
    console.log(`
用法: 
  处理单个文件: node upload-file-to-knowledge.js --file <文件路径> [--subject <学科分类>]
  处理整个目录: node upload-file-to-knowledge.js --dir <目录路径> [--subject <学科分类>]

例如:
  node upload-file-to-knowledge.js --file ./data/民法.txt --subject 法律
  node upload-file-to-knowledge.js --dir ./data/法律文档 --subject 法律
    `);
    process.exit(1);
  }
  
  // 解析参数
  let mode = '';
  let path = '';
  let subject = DEFAULT_SUBJECT;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      mode = 'file';
      path = args[i + 1] || '';
    } else if (args[i] === '--dir') {
      mode = 'dir';
      path = args[i + 1] || '';
    } else if (args[i] === '--subject') {
      subject = args[i + 1] || DEFAULT_SUBJECT;
    }
  }
  
  if (!mode || !path) {
    console.error('错误: 缺少必要参数');
    process.exit(1);
  }
  
  console.log(`开始处理 ${mode === 'file' ? '文件' : '目录'}: ${path}`);
  console.log(`使用学科分类: ${subject}`);
  
  // 根据模式执行不同的处理
  if (mode === 'file') {
    await handleSingleFile(path, subject);
  } else if (mode === 'dir') {
    await processDirectory(path, subject);
  }
}

// 执行主函数
main().catch(error => {
  console.error('运行脚本出错:', error);
  process.exit(1);
}); 