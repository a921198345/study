import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { convertOpmlToMindElixir } from '@/app/api/mindmap-data/route';

// 默认思维导图数据（民法测试数据）
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
    id: "root",
    topic: "民法",
    expanded: true,
    children: [
      {
        id: "civil-1",
        topic: "基本原则",
        expanded: true,
        children: [
          { id: "civil-1-1", topic: "平等原则" },
          { id: "civil-1-2", topic: "自愿原则" },
          { id: "civil-1-3", topic: "公平原则" },
          { id: "civil-1-4", topic: "诚信原则" },
          { id: "civil-1-5", topic: "守法与公序良俗原则" },
          { id: "civil-1-6", topic: "绿色原则" }
        ]
      },
      {
        id: "civil-2",
        topic: "民事权利",
        expanded: true,
        children: [
          { id: "civil-2-1", topic: "人身权" },
          { id: "civil-2-2", topic: "财产权" },
          { id: "civil-2-3", topic: "知识产权" }
        ]
      },
      {
        id: "civil-3",
        topic: "民事责任",
        expanded: true,
        children: [
          { id: "civil-3-1", topic: "违约责任" },
          { id: "civil-3-2", topic: "侵权责任" }
        ]
      }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const maxNodes = parseInt(searchParams.get('maxNodes') || '3000', 10);
    const maxDepth = parseInt(searchParams.get('maxDepth') || '10', 10);
    
    console.log(`mindmap-test API: 请求类型=${type}, 最大节点数=${maxNodes}, 最大深度=${maxDepth}`);
    
    // 根据类型返回不同的测试数据
    if (type === 'civil-law') {
      // 返回完整的民法测试数据 (从OPML文件)
      const opmlPath = path.join(process.cwd(), 'public', 'data', 'opml', '2025-05-05T07-03-05.810Z-民法.opml');
      
      if (!fs.existsSync(opmlPath)) {
        console.error(`OPML文件不存在: ${opmlPath}`);
        return NextResponse.json(
          { error: 'OPML文件不存在' },
          { status: 404 }
        );
      }
      
      console.log(`读取OPML文件: ${opmlPath}`);
      const opmlContent = fs.readFileSync(opmlPath, 'utf-8');
      
      // 使用convertOpmlToMindElixir函数处理OPML内容
      console.log(`转换OPML到思维导图数据，最大节点数=${maxNodes}，最大深度=${maxDepth}`);
      const mindmapData = await convertOpmlToMindElixir(opmlContent, maxNodes, maxDepth);
      
      // 添加请求参数信息到返回数据
      if (!mindmapData.meta) {
        mindmapData.meta = {
          totalNodes: 0,
          processedNodes: 0,
          skippedNodes: 0, 
          maxDepthReached: false
        };
      }
      
      mindmapData.meta = {
        ...mindmapData.meta,
        source: 'opml',
        type: 'civil-law',
        requestParams: {
          maxNodes,
          maxDepth
        }
      };
      
      return NextResponse.json(mindmapData);
    }
    
    // 默认返回简单的民法测试数据
    return NextResponse.json(DEFAULT_MINDMAP_DATA);
  } catch (error: unknown) {
    console.error('获取测试思维导图数据出错:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json(
      { error: `获取测试思维导图数据失败: ${errorMessage}` },
      { status: 500 }
    );
  }
} 