import { NextResponse } from 'next/server';

export async function GET() {
  // 返回一个非常简单的测试数据结构
  const testData = [
    {
      id: "root",
      title: "测试根节点",
      level: 0,
      children: [
        {
          id: "child1",
          title: "子节点1",
          level: 1,
          children: []
        },
        {
          id: "child2",
          title: "子节点2",
          level: 1,
          children: []
        }
      ]
    }
  ];
  
  return NextResponse.json(testData);
} 