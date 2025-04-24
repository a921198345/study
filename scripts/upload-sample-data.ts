import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase配置:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 示例知识数据
const sampleData = [
  {
    title: '民法的基本原则',
    content: `民法的基本原则包括：
1. 平等原则：民事主体在民事活动中的法律地位一律平等
2. 自愿原则：民事主体从事民事活动，应当遵循自愿原则，按照自己的意思设立、变更、终止民事法律关系
3. 公平原则：民事主体从事民事活动，应当遵循公平原则，合理确定各方的权利和义务
4. 诚信原则：民事主体从事民事活动，应当遵循诚信原则，秉持诚实，恪守承诺
5. 公序良俗原则：不得违反公序良俗
6. 绿色原则：民事主体从事民事活动，应当有利于节约资源、保护生态环境`
  },
  {
    title: '代理制度',
    content: `代理制度是指代理人在代理权限内，以被代理人的名义实施民事法律行为，所产生的法律后果由被代理人承担的法律制度。
代理的分类：
1. 委托代理：基于被代理人的委托而产生的代理关系
2. 法定代理：基于法律的规定而产生的代理关系
3. 指定代理：基于有关组织或有关部门的指定而产生的代理关系
代理权的授予和行使：
代理人必须在代理权限内，以被代理人的名义实施民事法律行为。
超越代理权限的民事法律行为，未经被代理人追认的，对被代理人不发生效力。`
  },
  {
    title: '行政法的特征',
    content: `行政法的主要特征包括：
1. 调整对象的广泛性：行政法调整国家行政机关和行政机关工作人员在行政管理活动中发生的各种社会关系
2. 法律渊源的多样性：包括宪法、法律、行政法规、地方性法规、规章等
3. 单向性和强制性：行政法体现了国家意志，具有单向性；行政法规范的实施具有强制性
4. 授权性与禁止性并存：对行政主体，行政法是授权性的，行政机关只能在法律授权范围内活动；对行政相对人，行政法是禁止性的
5. 行政法责任的多样性：包括行政处分、行政处罚、行政强制、行政赔偿等多种责任形式`
  },
  {
    title: '刑法的基本原则',
    content: `刑法的基本原则主要包括：
1. 罪刑法定原则：法律明文规定为犯罪行为的，依照法律定罪处刑；法律没有明文规定为犯罪行为的，不得定罪处刑
2. 法律面前人人平等原则：对任何人犯罪，在适用法律上一律平等
3. 罪责刑相适应原则：刑罚的轻重，应当与犯罪分子所犯罪行和承担的刑事责任相适应
4. 从旧兼从轻原则：法律溯及力的特殊规定`
  },
  {
    title: '合同法的主要内容',
    content: `合同法的主要内容包括：
1. 合同的订立：要约与承诺、合同成立的时间和地点
2. 合同的效力：有效合同、无效合同、可撤销合同、效力待定合同
3. 合同的履行：全面履行、适当履行、诚信履行
4. 合同的变更与转让：合同变更的条件和方式、合同权利义务的转让
5. 合同的终止：合同终止的情形、合同终止的法律后果
6. 违约责任：违约责任的构成要件、违约责任的承担方式
7. 合同的解释：合同解释的原则和方法`
  }
];

async function uploadSampleData() {
  try {
    console.log('开始上传示例数据...');
    
    // 创建一个法律科目
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .upsert({ name: '法律', description: '法律知识点' })
      .select();
    
    if (subjectError) throw subjectError;
    
    console.log('科目创建成功:', subjectData);
    const subjectId = subjectData[0].id;
    
    // 创建一个章节
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .upsert({ subject_id: subjectId, title: '基础知识', order_number: 1 })
      .select();
    
    if (chapterError) throw chapterError;
    
    console.log('章节创建成功:', chapterData);
    const chapterId = chapterData[0].id;
    
    // 上传知识点
    for (const entry of sampleData) {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .insert({
          chapter_id: chapterId,
          title: entry.title,
          content: entry.content
        });
      
      if (error) {
        console.error(`上传知识点 "${entry.title}" 时出错:`, error);
        continue;
      }
      
      console.log(`知识点 "${entry.title}" 上传成功`);
    }
    
    console.log('所有示例数据上传完成');
    
  } catch (error) {
    console.error('上传示例数据时出错:', error);
  }
}

uploadSampleData(); 