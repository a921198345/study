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
  useReactFlow,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
// 导入dagre布局库
import dagre from 'dagre';

// 默认思维导图数据
const DEFAULT_MIND_DATA = {
  nodeData: {
    id: 'root',
    topic: '思维导图',
    expanded: true,
    children: []
  }
};

// 自定义节点组件，增加连接点的可见性
const CustomNode = ({ data, id, selected }: NodeProps) => {
  const level = data?.level || 0;
  const maxWidth = Math.max(300 - level * 30, 150); // 根据层级减小节点宽度
  const fontSize = Math.max(16 - level, 12);        // 根据层级调整字体大小
  
  // 根据层级设置不同的颜色
  const getColor = () => {
    const colors = [
      { bg: '#f8fafc', border: '#334155', text: '#0f172a' }, // 根节点 - 浅灰色背景，深色文字
      { bg: '#eff6ff', border: '#2563eb', text: '#1e3a8a' }, // 一级 - 蓝色
      { bg: '#f0fdf4', border: '#16a34a', text: '#166534' }, // 二级 - 绿色
      { bg: '#fff7ed', border: '#ea580c', text: '#9a3412' }, // 三级 - 橙色
      { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' }, // 四级 - 红色
      { bg: '#faf5ff', border: '#9333ea', text: '#581c87' }, // 五级 - 紫色
    ];
    return colors[level % colors.length];
  };
  
  const color = getColor();
  
  return (
    <div
      className={`reactflow-node ${selected ? 'selected' : ''}`}
      style={{
        background: color.bg,
        borderColor: color.border,
        borderWidth: level === 0 ? '3px' : '2px', // 增加边框宽度使其更明显
        borderStyle: 'solid',
        borderRadius: '6px',
        padding: '10px 15px',
        maxWidth: `${maxWidth}px`,
        fontSize: `${fontSize}px`,
        fontWeight: level <= 1 ? 'bold' : 'normal',
        color: color.text, // 使用更深的文字颜色
        boxShadow: selected ? `0 0 0 2px ${color.border}` : '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {/* 增加明显的连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color.border, width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color.border, width: '8px', height: '8px' }}
      />
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
    borderColor?: string;
  };
}

// 自定义节点数据接口
interface CustomNodeData {
  label: string;
  level: number;
  style?: {
    background?: string;
    color?: string;
    fontSize?: string;
    borderColor?: string;
  };
}

// 主题颜色接口
interface ThemeColors {
  root: string;
  level1: string;
  level2: string;
  level3: string;
  default: string;
  background: string;
  edge: string;
}

// 组件属性接口
interface ReactFlowMapProps {
  data: MindNode | any;
  direction?: 'horizontal' | 'vertical';
  draggable?: boolean;
  editable?: boolean;
  contextMenu?: boolean;
  theme?: 'primary' | 'dark' | 'green' | 'purple';
  height?: string;
  width?: string;
  className?: string;
}

// 节点位置接口
interface NodePosition {
  x: number;
  y: number;
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

// 使用dagre实现自动布局
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: 'horizontal' | 'vertical'): { nodes: Node[], edges: Edge[] } => {
  if (nodes.length === 0) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // 设置布局方向和节点间距
  const isHorizontal = direction === 'horizontal';
  dagreGraph.setGraph({
    rankdir: isHorizontal ? 'LR' : 'TB',
    nodesep: 80,  // 节点水平间距
    ranksep: 100, // 节点垂直间距
    edgesep: 30,  // 边间距
    marginx: 50,  // 图边缘水平边距
    marginy: 50   // 图边缘垂直边距
  });

  // 节点宽高信息，为dagre计算布局提供必要信息
  nodes.forEach((node) => {
    // 根据节点层级调整节点大小
    const level = node.data?.level || 0;
    const nodeWidth = Math.max(300 - level * 20, 150); // 根据层级减小节点宽度
    const nodeHeight = 60; // 固定高度或根据内容动态计算

    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // 添加边信息
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 执行dagre布局算法
  dagre.layout(dagreGraph);

  // 使用dagre计算的位置更新节点
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // 更新源和目标连接点位置
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
      // 更新连接点位置，适应布局方向
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
    };
  });

  return { nodes: newNodes, edges };
};

// 将Mind Elixir格式转换为ReactFlow格式并应用布局
const convertToReactFlow = (
  data: any, 
  themeColors: ThemeColors, 
  direction: 'horizontal' | 'vertical' = 'horizontal'
): { nodes: Node[]; edges: Edge[] } => {
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
  const processNode = (node: any, parentId: string | null = null, level: number = 0) => {
    if (!node) {
      console.warn('ReactFlowMap: 处理空节点');
      return null;
    }
    
    // 确保节点有唯一ID
    const id = String(node.id || `node-${Math.random().toString(36).substr(2, 9)}`);
    
    // 确保节点有标题
    const label = node.topic || node.text || node.label || '节点';
    
    console.log(`ReactFlowMap: 处理节点 ID=${id}, 标题=${label.substring(0, 20)}, 级别=${level}`);
    
    // 根据主题获取颜色
    const nodeStyle = {
      background: level === 0 ? themeColors.root :
                 level === 1 ? themeColors.level1 :
                 level === 2 ? themeColors.level2 :
                 level === 3 ? themeColors.level3 : themeColors.default
    };
    
    // 创建ReactFlow节点(不设置初始位置，让dagre自动计算)
    const rfNode: Node = {
      id,
      // 默认位置，后续由dagre重新计算
      position: { x: 0, y: 0 },
      data: { 
        label, 
        level,
        style: { ...nodeStyle, ...(node.style || {}) }
      },
      type: 'custom',
      // 默认连接点方向，后续根据布局方向调整
      sourcePosition: direction === 'horizontal' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'horizontal' ? Position.Left : Position.Top,
    };
    
    nodes.push(rfNode);
    
    // 处理子节点
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((child: any) => {
        // 递归处理子节点
        const childId = processNode(child, id, level + 1);
        
        if (childId) {
          // 创建连接边
          const edge: Edge = {
            id: `e-${id}-${childId}`,
            source: id,
            target: childId,
            type: 'smoothstep', // 使用平滑曲线连接，更美观
            animated: false,
            style: { 
              stroke: themeColors.edge, 
              strokeWidth: 2.5, // 适当的线宽
              opacity: 1  // 完全不透明
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: themeColors.edge,
            },
          };
          
          edges.push(edge);
        }
      });
    }
    
    return id;
  };
  
  // 从根节点开始处理
  try {
    console.log('ReactFlowMap: 开始从根节点处理');
    processNode(rootNode, null, 0);
    console.log(`ReactFlowMap: 初步处理完成，生成 ${nodes.length} 个节点和 ${edges.length} 条边`);
    
    // 应用dagre自动布局
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    console.log(`ReactFlowMap: 布局完成，最终生成 ${layoutedNodes.length} 个节点和 ${layoutedEdges.length} 条边`);
    
    return { nodes: layoutedNodes, edges: layoutedEdges };
  } catch (error) {
    console.error('ReactFlowMap: 处理节点时出错:', error);
    return { nodes, edges };
  }
};

// 根据主题获取颜色
const getThemeColors = (themeName: string = 'primary'): ThemeColors => {
  switch (themeName) {
    case 'dark':
      return {
        root: '#333333',
        level1: '#8E44AD',
        level2: '#27AE60',
        level3: '#2C3E50',
        default: '#7F8C8D',
        background: '#192734',
        edge: '#bbbbbb' // 提高深色模式下连接线的亮度
      };
    case 'green':
      return {
        root: '#16A085',
        level1: '#2ECC71',
        level2: '#27AE60',
        level3: '#1ABC9C',
        default: '#29B765',
        background: '#EAFAF1',
        edge: '#0F6D5B'
      };
    case 'purple':
      return {
        root: '#8E44AD',
        level1: '#9B59B6',
        level2: '#8E44AD',
        level3: '#6C3483',
        default: '#9B59B6',
        background: '#F5EEF8',
        edge: '#5B2C6F'
      };
    default:
      return {
        root: '#3498DB',
        level1: '#2980B9',
        level2: '#1ABC9C',
        level3: '#16A085',
        default: '#3498DB',
        background: '#ECF0F1',
        edge: '#2C3E50'
      };
  }
};

// 主组件
const ReactFlowMap: React.FC<ReactFlowMapProps> = ({
  data,
  direction = 'horizontal',
  draggable = true,
  editable = false,
  contextMenu = false,
  theme = 'primary',
  height = '600px',
  width = '100%',
  className = '',
}) => {
  // 定义节点和边的类型
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors>(getThemeColors(theme));
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentDirection, setCurrentDirection] = useState(direction);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 监听主题变化
  useEffect(() => {
    if (theme !== currentTheme) {
      console.log(`ReactFlowMap: 主题变更 ${currentTheme} -> ${theme}`);
      setCurrentTheme(theme);
      const newColors = getThemeColors(theme);
      setThemeColors(newColors);
      
      // 应用新主题颜色到现有节点和边
      if (nodes.length > 0) {
        // 更新节点颜色
        const updatedNodes = nodes.map((node) => {
          if (!node.data) return node;
          
          const level = node.data.level;
          const nodeColor = level === 0 ? newColors.root :
                           level === 1 ? newColors.level1 :
                           level === 2 ? newColors.level2 :
                           level === 3 ? newColors.level3 : newColors.default;
                           
          return {
            ...node,
            data: {
              ...node.data,
              style: {
                ...(node.data.style || {}),
                background: nodeColor
              }
            }
          };
        });
        
        setNodes(updatedNodes);
        
        // 更新连接线颜色
        const updatedEdges = edges.map((edge) => {
          return {
            ...edge,
            style: {
              ...(edge.style || {}),
              stroke: newColors.edge,
              strokeWidth: 2.5,
              opacity: 1
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: newColors.edge
            }
          };
        });
        
        setEdges(updatedEdges);
      }
    }
  }, [theme, currentTheme, nodes, edges, setNodes, setEdges]);
  
  // 监听方向变化并重新布局
  useEffect(() => {
    if (direction !== currentDirection && isClient) {
      console.log(`ReactFlowMap: 方向变更 ${currentDirection} -> ${direction}`);
      setCurrentDirection(direction);
      refreshLayout();
    }
  }, [direction, currentDirection, isClient]);
  
  // 初始化节点和边缘
  useEffect(() => {
    if (!isClient) return;
    
    try {
      console.log('ReactFlowMap: 处理思维导图数据...');
      
      // 将数据转换为ReactFlow格式
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data, themeColors, direction);
      
      // 设置节点和边缘
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      console.log('ReactFlowMap: 思维导图数据处理完成，节点数:', flowNodes.length);
    } catch (err) {
      console.error('ReactFlowMap: 初始化思维导图出错:', err);
      setError('初始化思维导图时出错，请检查数据格式');
    }
  }, [data, isClient, setNodes, setEdges, themeColors, direction]);
  
  // 处理节点点击
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('ReactFlowMap: 点击节点:', node);
    // 可以在这里添加节点点击处理逻辑，如高亮或展开/折叠
  }, []);
  
  // 刷新布局
  const refreshLayout = useCallback(() => {
    try {
      console.log('ReactFlowMap: 刷新布局...');
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data, themeColors, currentDirection);
      setNodes(flowNodes);
      setEdges(flowEdges);
      console.log('ReactFlowMap: 布局刷新完成');
    } catch (err) {
      console.error('ReactFlowMap: 刷新布局出错:', err);
      setError('刷新布局时出错，请检查数据格式');
    }
  }, [data, themeColors, currentDirection, setNodes, setEdges]);
  
  // 处理连接线创建事件
  const onConnect = useCallback((params: any) => {
    console.log('ReactFlowMap: 创建连接线:', params);
    // 如果需要允许用户创建自定义连接，可以在这里处理
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  // 设置背景颜色
  const bgColor = themeColors.background;
  
  return (
    <div className={`react-flow-container ${className}`} style={{ 
      width, height, position: 'relative',
      backgroundColor: bgColor,
      transition: 'background-color 0.3s ease'
    }}>
      {error ? (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4 rounded-md">
          <div className="text-red-500 mb-2 font-medium">错误: {error}</div>
          <div className="text-sm text-gray-600">
            尝试刷新页面或检查数据格式。如果问题持续，请联系管理员。
          </div>
          <button 
            onClick={refreshLayout}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            尝试重新加载
          </button>
        </div>
      ) :
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              connectionLineType={ConnectionLineType.SmoothStep} // 使用平滑曲线连接类型
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.1}
              maxZoom={4}
              nodesConnectable={editable}
              nodesDraggable={draggable}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
              snapGrid={[20, 20]}
              snapToGrid={true}
              fitViewOptions={{
                padding: 0.2,
                includeHiddenNodes: false,
              }}
            >
              <Background 
                color={theme === 'dark' ? '#555' : '#aaa'} 
                gap={24} 
                size={1.5} 
              />
              <Controls 
                showInteractive={true} 
                className="shadow-lg bg-white/90 dark:bg-gray-800/90"
              />
              <Panel position="top-right" className="bg-white/80 dark:bg-gray-800/80 p-2 rounded shadow">
                <button
                  onClick={refreshLayout}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  重新布局
                </button>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      }
    </div>
  );
};

export default ReactFlowMap; 