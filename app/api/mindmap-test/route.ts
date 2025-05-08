import { NextRequest, NextResponse } from 'next/server';

// 默认思维导图数据，民法知识结构
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
    id: "root",
    topic: "民法典",
    expanded: true,
    children: [
      {
        id: "basic",
        topic: "基本原则",
        expanded: true,
        children: [
          {
            id: "basic-1",
            topic: "平等原则",
            expanded: true
          },
          {
            id: "basic-2",
            topic: "自愿原则",
            expanded: true
          },
          {
            id: "basic-3",
            topic: "公平原则",
            expanded: true
          },
          {
            id: "basic-4",
            topic: "诚信原则",
            expanded: true
          },
          {
            id: "basic-5",
            topic: "守法与公序良俗原则",
            expanded: true
          },
          {
            id: "basic-6",
            topic: "绿色原则",
            expanded: true
          }
        ]
      },
      {
        id: "subject",
        topic: "民事主体",
        expanded: true,
        children: [
          {
            id: "subject-1",
            topic: "自然人",
            expanded: true,
            children: [
              { id: "subject-1-1", topic: "民事权利能力", expanded: true },
              { id: "subject-1-2", topic: "民事行为能力", expanded: true },
              { id: "subject-1-3", topic: "监护", expanded: true },
              { id: "subject-1-4", topic: "宣告失踪和宣告死亡", expanded: true }
            ]
          },
          {
            id: "subject-2",
            topic: "法人",
            expanded: true,
            children: [
              { id: "subject-2-1", topic: "一般规定", expanded: true },
              { id: "subject-2-2", topic: "营利法人", expanded: true },
              { id: "subject-2-3", topic: "非营利法人", expanded: true },
              { id: "subject-2-4", topic: "特别法人", expanded: true }
            ]
          },
          {
            id: "subject-3",
            topic: "非法人组织",
            expanded: true
          }
        ]
      },
      {
        id: "rights",
        topic: "民事权利",
        expanded: true,
        children: [
          {
            id: "rights-1",
            topic: "人格权",
            expanded: true,
            children: [
              { id: "rights-1-1", topic: "生命权、健康权和身体权", expanded: true },
              { id: "rights-1-2", topic: "姓名权和名称权", expanded: true },
              { id: "rights-1-3", topic: "肖像权", expanded: true },
              { id: "rights-1-4", topic: "名誉权和荣誉权", expanded: true },
              { id: "rights-1-5", topic: "隐私权和个人信息保护", expanded: true }
            ]
          },
          {
            id: "rights-2",
            topic: "物权",
            expanded: true,
            children: [
              { id: "rights-2-1", topic: "所有权", expanded: true },
              { id: "rights-2-2", topic: "用益物权", expanded: true },
              { id: "rights-2-3", topic: "担保物权", expanded: true },
              { id: "rights-2-4", topic: "占有", expanded: true }
            ]
          },
          {
            id: "rights-3",
            topic: "债权",
            expanded: true,
            children: [
              { id: "rights-3-1", topic: "合同", expanded: true },
              { id: "rights-3-2", topic: "侵权责任", expanded: true },
              { id: "rights-3-3", topic: "不当得利", expanded: true }
            ]
          },
          {
            id: "rights-4",
            topic: "知识产权",
            expanded: true
          },
          {
            id: "rights-5",
            topic: "继承权",
            expanded: true,
            children: [
              { id: "rights-5-1", topic: "法定继承", expanded: true },
              { id: "rights-5-2", topic: "遗嘱继承", expanded: true },
              { id: "rights-5-3", topic: "遗赠", expanded: true },
              { id: "rights-5-4", topic: "遗产处理", expanded: true }
            ]
          }
        ]
      },
      {
        id: "marriage",
        topic: "婚姻家庭",
        expanded: true,
        children: [
          { id: "marriage-1", topic: "结婚", expanded: true },
          { id: "marriage-2", topic: "夫妻关系", expanded: true },
          { id: "marriage-3", topic: "离婚", expanded: true },
          { id: "marriage-4", topic: "父母子女关系", expanded: true },
          { id: "marriage-5", topic: "收养", expanded: true }
        ]
      },
      {
        id: "liability",
        topic: "民事责任",
        expanded: true,
        children: [
          { id: "liability-1", topic: "民事责任形式", expanded: true },
          { id: "liability-2", topic: "归责原则", expanded: true },
          { id: "liability-3", topic: "责任主体", expanded: true },
          { id: "liability-4", topic: "免责事由", expanded: true }
        ]
      }
    ]
  }
};

// API路由处理函数
export async function GET(request: NextRequest) {
  try {
    console.log('提供民法测试思维导图数据');
    
    // 返回民法思维导图数据
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  } catch (error: unknown) {
    console.error('测试API出错:', error);
    return NextResponse.json(
      { error: `测试API出错: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 