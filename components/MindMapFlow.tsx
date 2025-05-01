'use client'

import React, { useState, useEffect, useCallback, MouseEvent } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  Panel,
  ControlButton,
  OnInit,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ZoomIn, ZoomOut, Plus, Minus, Expand, Maximize, Minimize } from 'lucide-react';

// 节点数据类型
type NodeData = {
  id: string | number;
  title: string;
  level?: number;
  parentId?: string | number | null;
  children?: NodeData[] | (string | number)[];
};

// 自定义节点的数据类型
interface CustomNodeData {
  label: string;
  level: number;
  childCount: number;
  collapsed: boolean;
}

interface MindMapFlowProps {
  data: NodeData | NodeData[];
}

// 自定义节点组件 - 根节点
const RootNode = ({ data }: { data: CustomNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-blue-500 text-white border-2 border-blue-700 min-w-[180px] text-center">
      <div className="font-bold">{data.label}</div>
      {data.collapsed && <div className="text-xs mt-1">+ {data.childCount} 个节点</div>}
    </div>
  );
};

// 主题节点 - 一级主题
const TopicNode = ({ data }: { data: CustomNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-red-500 text-white border-2 border-red-700 min-w-[160px] text-center">
      <div>{data.label}</div>
      {data.collapsed && <div className="text-xs mt-1">+ {data.childCount} 个节点</div>}
    </div>
  );
};

// 子主题节点 - 二级及以下主题
const SubtopicNode = ({ data }: { data: CustomNodeData }) => {
  return (
    <div className="px-3 py-1 shadow-md rounded-lg bg-green-500 text-white border-2 border-green-700 min-w-[140px] text-center">
      <div>{data.label}</div>
      {data.collapsed && <div className="text-xs mt-1">+ {data.childCount} 个节点</div>}
    </div>
  );
};

// 叶子节点 - 最底层主题
const LeafNode = ({ data }: { data: CustomNodeData }) => {
  return (
    <div className="px-2 py-1 shadow-sm rounded-lg bg-amber-500 text-white border-2 border-amber-700 min-w-[120px] text-center">
      <div className="text-sm">{data.label}</div>
    </div>
  );
};

// 节点类型映射
const nodeTypes = {
  root: RootNode,
  topic: TopicNode,
  subtopic: SubtopicNode,
  leaf: LeafNode,
};

// 根据层级获取节点类型
const getNodeTypeByLevel = (level: number): string => {
  if (level === 0) return 'root';
  if (level === 1) return 'topic';
  if (level === 2) return 'subtopic';
  return 'leaf';
};

// 获取子节点连接的位置
const getChildPosition = (index: number, total: number): Position => {
  if (index === 0 && total === 1) return Position.Bottom;
  
  if (index < total / 2) {
    return Position.Bottom;
  } else {
    return Position.Bottom;
  }
};

// 获取父节点连接的位置
const getParentPosition = (childIndex: number, totalChildren: number): Position => {
  if (childIndex === 0 && totalChildren === 1) return Position.Top;
  
  if (childIndex < totalChildren / 2) {
    return Position.Top;
  } else {
    return Position.Top;
  }
};

export function MindMapFlow({ data }: MindMapFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [originalData, setOriginalData] = useState<NodeData[]>([]);

  // 获取子树中所有节点的数量
  const countChildren = (node: NodeData, allNodes: NodeData[]): number => {
    let count = 0;
    if (node.children) {
      if (node.children.length > 0 && typeof node.children[0] !== 'object') {
        // ID引用的情况
        const childIds = node.children as (string | number)[];
        for (const childId of childIds) {
          const childNode = allNodes.find(n => n.id === childId);
          if (childNode) {
            count += 1 + countChildren(childNode, allNodes);
          }
        }
      } else {
        // 直接对象引用
        for (const child of node.children as NodeData[]) {
          count += 1 + countChildren(child, allNodes);
        }
      }
    }
    return count;
  };

  // 扁平化数据，处理ID引用
  const flattenData = useCallback((data: NodeData | NodeData[]) => {
    const dataArray = Array.isArray(data) ? data : [data];
    const flattenedNodes: NodeData[] = [];
    
    // 递归处理节点，记录其父节点和层级
    const processNode = (node: NodeData, parentId: string | number | null = null, level = 0) => {
      // 创建新节点ID（确保字符串形式）
      const nodeId = String(node.id);
      
      // 添加到平铺数组
      flattenedNodes.push({
        ...node,
        level,
        parentId
      });
      
      // 处理子节点
      if (node.children) {
        // 如果子节点是ID数组，找到对应的节点对象
        if (node.children.length > 0 && typeof node.children[0] !== 'object') {
          const childIds = node.children as (string | number)[];
          childIds.forEach(childId => {
            // 在dataArray中查找对应ID的节点
            const childNode = dataArray.find(n => n.id === childId);
            if (childNode) {
              processNode(childNode, nodeId, level + 1);
            }
          });
        } else {
          // 子节点是对象数组的情况
          (node.children as NodeData[]).forEach(child => {
            processNode(child, nodeId, level + 1);
          });
        }
      }
    };
    
    // 处理根节点
    if (dataArray.length > 0) {
      processNode(dataArray[0], null, 0);
    }
    
    return flattenedNodes;
  }, []);

  // 处理节点点击 - 折叠/展开
  const handleNodeClick: NodeMouseHandler = (event: React.MouseEvent, node: Node) => {
    const nodeId = node.id;
    const newCollapsedNodes = new Set(collapsedNodes);
    
    if (newCollapsedNodes.has(nodeId)) {
      newCollapsedNodes.delete(nodeId);
    } else {
      newCollapsedNodes.add(nodeId);
    }
    
    setCollapsedNodes(newCollapsedNodes);
    processData(originalData, newCollapsedNodes);
  };

  // 将思维导图数据转换为React Flow节点和边
  const processData = useCallback((data: NodeData | NodeData[], collapsed: Set<string> = new Set()) => {
    const dataArray = Array.isArray(data) ? data : [data];
    setOriginalData(dataArray);
    
    // 平铺所有节点
    const flattenedNodes = flattenData(data);
    
    // 过滤出可见的节点
    const visibleNodes: NodeData[] = [];
    for (const node of flattenedNodes) {
      // 检查该节点的所有祖先是否有被折叠的
      let isHidden = false;
      let parent = node.parentId;
      while (parent) {
        if (collapsed.has(String(parent))) {
          isHidden = true;
          break;
        }
        
        // 查找父节点的父节点
        const parentNode = flattenedNodes.find(n => String(n.id) === String(parent));
        parent = parentNode?.parentId || null;
      }
      
      if (!isHidden) {
        visibleNodes.push(node);
      }
    }
    
    // 创建React Flow节点和边
    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];
    
    // 计算每个层级的节点数量，用于水平分布
    const levelCounts = visibleNodes.reduce((acc, node) => {
      const level = node.level || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // 节点当前位置跟踪器
    const levelPositions = {} as Record<number, number>;
    Object.keys(levelCounts).forEach(level => {
      levelPositions[Number(level)] = 0;
    });
    
    // 排序节点，按层级和父节点分组
    const sortedNodes = [...visibleNodes].sort((a, b) => {
      // 首先按层级排序
      if ((a.level || 0) !== (b.level || 0)) {
        return (a.level || 0) - (b.level || 0);
      }
      
      // 同一层级，按父节点分组
      if (a.parentId !== b.parentId) {
        return String(a.parentId || '').localeCompare(String(b.parentId || ''));
      }
      
      // 同一父节点下的节点，保持原有顺序
      return 0;
    });
    
    // 创建React Flow节点
    for (const node of sortedNodes) {
      const level = node.level || 0;
      const nodeId = String(node.id);
      
      // 计算节点位置
      const totalNodesInLevel = levelCounts[level] || 1;
      const currentPosition = levelPositions[level] = (levelPositions[level] || 0) + 1;
      
      // 水平均匀分布
      const xPosition = (currentPosition - (totalNodesInLevel + 1) / 2) * 250;
      // 垂直分层
      const yPosition = level * 180;
      
      // 计算子节点数量（用于折叠显示）
      const childCount = countChildren(node, flattenedNodes);
      const isCollapsed = collapsed.has(nodeId);
      
      // 创建节点
      const newNode: Node = {
        id: nodeId,
        type: getNodeTypeByLevel(level),
        data: { 
          label: node.title || '未命名节点',
          level,
          childCount,
          collapsed: isCollapsed,
        },
        position: { x: xPosition, y: yPosition },
        style: { width: 'auto', minWidth: 100 }
      };
      
      allNodes.push(newNode);
      
      // 创建边（连线）
      if (node.parentId) {
        const parentId = String(node.parentId);
        // 子节点与父节点之间的连线
        const newEdge: Edge = {
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          // 使用曲线连接
          type: 'smoothstep',
          animated: false,
          style: { 
            stroke: '#555',
            strokeWidth: 1.5,
          },
        };
        
        allEdges.push(newEdge);
      }
    }
    
    setNodes(allNodes);
    setEdges(allEdges);
  }, [flattenData, setNodes, setEdges]);
  
  useEffect(() => {
    processData(data, collapsedNodes);
  }, [data, processData]);
  
  // 居中和缩放视图
  const fitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };
  
  // 展开/折叠所有节点
  const expandAll = () => {
    setCollapsedNodes(new Set());
    processData(originalData, new Set());
  };
  
  const collapseAll = () => {
    // 获取所有可折叠的节点（有子节点的节点）
    const collapsible = new Set<string>();
    const flattenedNodes = flattenData(originalData);
    
    flattenedNodes.forEach(node => {
      if (node.children && 
         ((Array.isArray(node.children) && node.children.length > 0) ||
          (typeof node.children === 'object' && Object.keys(node.children).length > 0))) {
        collapsible.add(String(node.id));
      }
    });
    
    setCollapsedNodes(collapsible);
    processData(originalData, collapsible);
  };
  
  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
    setTimeout(() => {
      // 延迟执行以确保节点已渲染
      if (instance) {
        instance.fitView({ padding: 0.2 });
      }
    }, 100);
  };
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-right"
        nodesDraggable={false} // 禁止拖动节点，保持布局
      >
        <Controls>
          <ControlButton title="展开所有节点" onClick={expandAll}>
            <Maximize size={16} />
          </ControlButton>
          <ControlButton title="折叠所有节点" onClick={collapseAll}>
            <Minimize size={16} />
          </ControlButton>
        </Controls>
        <MiniMap zoomable pannable />
        <Background color="#aaa" gap={16} />
        <Panel position="top-right">
          <div className="flex space-x-2">
            <button 
              onClick={fitView}
              className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              居中视图
            </button>
            <button 
              onClick={expandAll}
              className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              展开全部
            </button>
            <button 
              onClick={collapseAll}
              className="px-3 py-1 bg-amber-600 text-white rounded shadow hover:bg-amber-700"
            >
              折叠全部
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
} 