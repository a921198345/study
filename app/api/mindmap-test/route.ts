import { NextRequest, NextResponse } from 'next/server';

// 默认思维导图数据，简单结构
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
    id: "root",
    topic: "测试思维导图",
    expanded: true,
    children: [
      {
        id: "test-1",
        topic: "测试节点1",
        expanded: true,
        children: [
          {
            id: "test-1-1",
            topic: "子节点1.1",
            expanded: true
          },
          {
            id: "test-1-2",
            topic: "子节点1.2",
            expanded: true
          }
        ]
      },
      {
        id: "test-2",
        topic: "测试节点2",
        expanded: true,
        children: [
          {
            id: "test-2-1",
            topic: "子节点2.1",
            expanded: true
          }
        ]
      }
    ]
  }
};

// API路由处理函数
export async function GET(request: NextRequest) {
  try {
    console.log('提供测试思维导图数据');
    
    // 返回默认思维导图数据
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  } catch (error) {
    console.error('测试API出错:', error);
    return NextResponse.json(
      { error: `测试API出错: ${error.message}` },
      { status: 500 }
    );
  }
} 