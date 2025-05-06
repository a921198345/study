'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  NodeTypes,
  ConnectionLineType,
  MarkerType,
  Node,
  Edge,
  NodeProps,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 导入默认数据，与MindElixirMap中相同
const DEFAULT_MIND_DATA = {
  nodeData: {
    id: 'root',
    topic: '思维导图',
    expanded: true,
    children: []
  }
};

// 自定义节点组件
const CustomNode = ({ data, isConnectable }: NodeProps) => {
  const color = data.level === 0 ? '#4a89ff' : 
               data.level === 1 ? '#ff6b6b' : 
               data.level === 2 ? '#2ecc71' : 
               data.level === 3 ? '#9b59b6' : '#f39c12';

  return (
    <div
      className="px-3 py-2 rounded-md shadow-md text-white"
      style={{ 
        background: data.style?.background || color,
        minWidth: '50px',
        maxWidth: '250px',
        fontSize: data.style?.fontSize || '14px',
        color: data.style?.color || 'white',
        fontWeight: data.level === 0 ? 'bold' : 'normal',
      }}
    >
      {data.label}
    </div>
  );
};

// 定义节点类型
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// 节点数据结构接口
interface MindNode {
  id: string;
  topic: string;
  children?: MindNode[];
  expanded?: boolean;
  direction?: 'right' | 'left';
  style?: {
    background?: string;
    color?: string;
    fontSize?: string;
  };
}

// 组件属性接口
interface ReactFlowMapProps {
  data: MindNode | any;
  direction?: 'right' | 'side';
  draggable?: boolean;
  editable?: boolean;
  contextMenu?: boolean;
  theme?: 'primary' | 'dark' | 'green' | 'purple';
  height?: string;
  width?: string;
  className?: string;
}

// 验证数据的格式
const isValidData = (data: any): boolean => {
  if (!data) {
    console.warn('ReactFlowMap: 数据为null或undefined');
    return false;
  }
  
  if (typeof data !== 'object') {
    console.warn(`ReactFlowMap: 数据不是对象类型，而是 ${typeof data}`);
    return false;
  }
  
  console.log('ReactFlowMap: 数据对象结构:', Object.keys(data));
  
  // 允许nodeData结构
  if (data.nodeData && typeof data.nodeData === 'object') {
    // 输出节点数据信息以便调试
    console.log(`ReactFlowMap: 检测到nodeData结构，ID=${data.nodeData.id}, 主题=${data.nodeData.topic?.substring(0, 30)}`);
    
    // 检查节点结构基本完整性
    if (!data.nodeData.id) {
      console.warn('ReactFlowMap: nodeData缺少ID');
      return false;
    }
    
    if (!data.nodeData.topic) {
      console.warn('ReactFlowMap: nodeData缺少topic');
      return false;
    }
    
    return true;
  }
  
  // 允许直接节点结构
  if (data.id && data.topic) {
    console.log(`ReactFlowMap: 检测到单节点结构，ID=${data.id}, 主题=${data.topic?.substring(0, 30)}`);
    return true;
  }
  
  // 允许topic结构（不完整但可以修复）
  if (data.topic) {
    console.log(`ReactFlowMap: 检测到不完整节点结构，主题=${data.topic?.substring(0, 30)}`);
    return true;
  }
  
  console.warn('ReactFlowMap: 无效的数据结构:', data);
  return false;
};

// 将Mind Elixir格式转换为ReactFlow格式
const convertToReactFlow = (data: any) => {
  console.log('ReactFlowMap: 开始数据转换...');
  
  // 如果没有有效数据，使用默认数据
  if (!isValidData(data)) {
    console.warn('ReactFlowMap: 提供的数据无效，使用默认数据');
    data = DEFAULT_MIND_DATA;
  }

  // 确保我们有正确的数据格式
  let rootNode;
  
  if (data.nodeData) {
    rootNode = data.nodeData;
    console.log('ReactFlowMap: 使用nodeData结构');
  } else if (data.topic) {
    rootNode = data;
    console.log('ReactFlowMap: 使用单节点结构');
  } else {
    rootNode = DEFAULT_MIND_DATA.nodeData;
    console.log('ReactFlowMap: 使用默认数据结构');
  }

  // 确保rootNode有ID
  if (!rootNode.id) {
    rootNode.id = 'root';
    console.log('ReactFlowMap: 为根节点添加默认ID');
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // 递归处理节点
  const processNode = (node: any, parentId: string | null = null, level: number = 0, position = { x: 0, y: 0 }, direction: string = 'right') => {
    if (!node) {
      console.warn('ReactFlowMap: 处理空节点');
      return;
    }
    
    // 确保节点有ID
    const id = String(node.id || `node-${Math.random().toString(36).substr(2, 9)}`);
    
    // 确保节点有标题
    const label = node.topic || node.text || node.label || '节点';
    
    console.log(`ReactFlowMap: 处理节点 ID=${id}, 标题=${label.substring(0, 20)}, 级别=${level}`);
    
    // 添加节点
    nodes.push({
      id,
      type: 'custom',
      position,
      data: { 
        label, 
        level,
        style: node.style || {}
      },
      style: {
        width: 'auto',
        height: 'auto',
      },
    });
    
    // 如果有父节点，添加连接边
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#888' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#888',
        },
      });
    }
    
    // 处理子节点
    if (node.children && Array.isArray(node.children)) {
      const childCount = node.children.length;
      console.log(`ReactFlowMap: 处理节点 ${id} 的 ${childCount} 个子节点`);
      
      const spacing = 150; // 节点间距
      
      node.children.forEach((child: any, index: number) => {
        if (!child) {
          console.warn(`ReactFlowMap: 节点 ${id} 的第 ${index} 个子节点为空`);
          return;
        }
        
        let childPosition;
        
        if (direction === 'right') {
          // 水平布局 - 子节点在右侧
          childPosition = {
            x: position.x + 250, // 向右偏移
            y: position.y - ((childCount - 1) * spacing / 2) + (index * spacing) // 垂直分布
          };
        } else {
          // 中心布局 - 子节点围绕父节点
          const angle = (2 * Math.PI * index) / childCount;
          childPosition = {
            x: position.x + Math.cos(angle) * 250,
            y: position.y + Math.sin(angle) * 150
          };
        }
        
        processNode(child, id, level + 1, childPosition, direction);
      });
    }
  };
  
  // 从根节点开始处理
  try {
    console.log('ReactFlowMap: 开始从根节点处理');
    processNode(rootNode, null, 0, { x: 50, y: 50 }, 'right');
    console.log(`ReactFlowMap: 处理完成，生成 ${nodes.length} 个节点和 ${edges.length} 条边`);
  } catch (error) {
    console.error('ReactFlowMap: 处理节点时出错:', error);
  }
  
  return { nodes, edges };
};

// 根据主题获取颜色
const getThemeColor = (themeName: string): string => {
  switch (themeName) {
    case 'dark':
      return '#333333';
    case 'green':
      return '#2ecc71';
    case 'purple':
      return '#9b59b6';
    case 'primary':
    default:
      return '#4a89ff';
  }
};

// 主组件
const ReactFlowMap: React.FC<ReactFlowMapProps> = ({
  data,
  direction = 'right',
  draggable = true,
  editable = false,
  contextMenu = false,
  theme = 'primary',
  height = '600px',
  width = '100%',
  className = '',
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reactFlowWrapper = useRef(null);
  
  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 初始化节点和边缘
  useEffect(() => {
    if (!isClient) return;
    
    try {
      console.log('处理思维导图数据...');
      
      // 将数据转换为ReactFlow格式
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data);
      
      // 设置节点和边缘
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      console.log('思维导图数据处理完成，节点数:', flowNodes.length);
    } catch (err) {
      console.error('初始化思维导图出错:', err);
      setError('初始化思维导图时出错，请检查数据格式');
    }
  }, [data, direction, isClient, setNodes, setEdges]);
  
  // 处理节点点击
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('点击节点:', node);
  }, []);
  
  // 水平分布节点
  const onLayout = useCallback(() => {
    const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data);
    setNodes([...flowNodes]);
    setEdges([...flowEdges]);
  }, [data, setNodes, setEdges]);
  
  if (!isClient) {
    return null;
  }
  
  return (
    <div className={`react-flow-container ${className}`} style={{ width, height, position: 'relative' }}>
      {error ? (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4 rounded-md">
          <div className="text-red-500 mb-2 font-medium">错误: {error}</div>
          <div className="text-sm text-gray-600">
            尝试刷新页面或检查数据格式。如果问题持续，请联系管理员。
          </div>
        </div>
      ) : (
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.1}
              maxZoom={4}
              nodesConnectable={editable}
              nodesDraggable={draggable}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls />
              <Panel position="top-right">
                <div className="flex gap-2">
                  <button
                    onClick={() => onLayout()}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    重新布局
                  </button>
                  <button
                    onClick={() => {
                      setNodes((nds) =>
                        nds.map((node) => ({
                          ...node,
                          position: { ...node.position }
                        }))
                      );
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    刷新
                  </button>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
};

export default ReactFlowMap; 