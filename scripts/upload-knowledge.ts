import fs from 'fs';
import path from 'path';
import { loadEnv } from './load-env';

// 先加载环境变量
loadEnv();

// 确保环境变量加载后再导入需要环境变量的模块
import { OpenAI } from 'openai';
import { supabaseAdmin } from '../lib/supabase';

// 配置OpenAI客户端（用于生成嵌入向量）
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 示例知识点数据
const sampleKnowledge = [
  {
    subject: '法考',
    chapter: '民法',
    entries: [
      {
        title: '民法典总则',
        content: `民法典是调整平等主体的自然人、法人和非法人组织之间的人身关系和财产关系的法律规范的总称。
民法的基本原则包括：平等原则、自愿原则、公平原则、诚信原则、守法与公序良俗原则、绿色原则。
民事主体包括自然人、法人和非法人组织。自然人是指作为民事主体的人，而法人是具有民事权利能力和民事行为能力，依法独立享有民事权利和承担民事义务的组织。`
      },
      {
        title: '民法中的代理制度',
        content: `代理是指代理人在代理权限内，以被代理人的名义实施民事法律行为，由此产生的法律后果直接归属于被代理人的法律制度。
代理的分类：
1. 委托代理：基于代理人与被代理人之间的代理协议而产生的代理。
2. 法定代理：基于法律的直接规定而产生的代理。
3. 指定代理：基于有权机关的指定而产生的代理。
无权代理：行为人没有代理权、超越代理权或代理权终止后仍以代理人名义实施的民事法律行为，未经被代理人追认的，对被代理人不发生效力。`
      }
    ]
  },
  {
    subject: '考公',
    chapter: '行政法',
    entries: [
      {
        title: '行政法的概念与特征',
        content: `行政法是调整行政法律关系的法律规范的总称，是国家行政机关及其工作人员在行政活动中与行政相对人之间的权利义务关系的法律规范。
行政法的特征：
1. 单方意志性：行政法体现的是国家意志，行政机关可以单方面作出行政行为。
2. 职权与责任统一：行政机关既有权力，也有相应的责任和义务。
3. 普遍适用性：行政法适用于所有行政主体。
4. 程序与实体并重：既关注实体问题，也重视程序正义。`
      }
    ]
  }
];

// 生成文本嵌入
async function generateEmbedding(text: string) {
  try {
    console.log('正在生成嵌入向量，文本长度:', text.length);
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('生成嵌入向量时出错:', error);
    throw error;
  }
}

// 上传知识库数据
async function uploadKnowledge(data = sampleKnowledge) {
  console.log('开始上传知识库数据...');
  console.log(`当前OpenAI API密钥: ${process.env.OPENAI_API_KEY ? '已设置' : '未设置'}`);
  
  for (const subjectData of data) {
    try {
      // 1. 创建或获取科目
      console.log(`处理科目: ${subjectData.subject}`);
      
      let subjectId: number;
      const { data: existingSubject, error: subjectQueryError } = await supabaseAdmin
        .from('subjects')
        .select('id')
        .eq('name', subjectData.subject)
        .maybeSingle();
        
      if (subjectQueryError) throw subjectQueryError;
      
      if (existingSubject) {
        subjectId = existingSubject.id;
        console.log(`科目"${subjectData.subject}"已存在，ID: ${subjectId}`);
      } else {
        const { data: newSubject, error: subjectInsertError } = await supabaseAdmin
          .from('subjects')
          .insert({ name: subjectData.subject, description: `${subjectData.subject}相关知识` })
          .select('id')
          .single();
          
        if (subjectInsertError) throw subjectInsertError;
        
        subjectId = newSubject.id;
        console.log(`已创建科目"${subjectData.subject}"，ID: ${subjectId}`);
      }
      
      // 2. 创建或获取章节
      console.log(`处理章节: ${subjectData.chapter}`);
      
      let chapterId: number;
      const { data: existingChapter, error: chapterQueryError } = await supabaseAdmin
        .from('chapters')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('title', subjectData.chapter)
        .maybeSingle();
        
      if (chapterQueryError) throw chapterQueryError;
      
      if (existingChapter) {
        chapterId = existingChapter.id;
        console.log(`章节"${subjectData.chapter}"已存在，ID: ${chapterId}`);
      } else {
        const { data: newChapter, error: chapterInsertError } = await supabaseAdmin
          .from('chapters')
          .insert({ subject_id: subjectId, title: subjectData.chapter, order_number: 1 })
          .select('id')
          .single();
          
        if (chapterInsertError) throw chapterInsertError;
        
        chapterId = newChapter.id;
        console.log(`已创建章节"${subjectData.chapter}"，ID: ${chapterId}`);
      }
      
      // 3. 上传知识点
      for (const entry of subjectData.entries) {
        console.log(`处理知识点: ${entry.title}`);
        
        // 检查知识点是否已存在
        const { data: existingEntry, error: entryQueryError } = await supabaseAdmin
          .from('knowledge_entries')
          .select('id')
          .eq('chapter_id', chapterId)
          .eq('title', entry.title)
          .maybeSingle();
          
        if (entryQueryError) throw entryQueryError;
        
        if (existingEntry) {
          console.log(`知识点"${entry.title}"已存在，跳过`);
          continue;
        }
        
        // 生成嵌入向量
        console.log('生成嵌入向量...');
        const embedding = await generateEmbedding(entry.title + " " + entry.content);
        
        // 插入知识点
        const { error: entryInsertError } = await supabaseAdmin
          .from('knowledge_entries')
          .insert({
            chapter_id: chapterId,
            title: entry.title,
            content: entry.content,
            embedding
          });
          
        if (entryInsertError) throw entryInsertError;
        
        console.log(`已上传知识点"${entry.title}"`);
      }
      
    } catch (error) {
      console.error(`处理科目"${subjectData.subject}"时出错:`, error);
    }
  }
  
  console.log('知识库数据上传完成');
}

// 执行上传
uploadKnowledge(); 