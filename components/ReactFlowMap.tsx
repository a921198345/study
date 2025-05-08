'use client'

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  ReactFlowInstance,
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
  const [expanded, setExpanded] = useState(!data.isCollapsed);
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
  
  // 处理展开/折叠点击
  const handleExpandClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setExpanded(!expanded);
    
    // 通过自定义事件将展开/折叠状态传递给父组件
    const customEvent = new CustomEvent('node:toggle', { 
      detail: { id, expanded: !expanded }
    });
    window.dispatchEvent(customEvent);
  };
  
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
      {data.hasHiddenChildren && (
        <div 
          className="expand-button"
          onClick={handleExpandClick}
          style={{
            position: 'absolute',
            right: '-25px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          {expanded ? '-' : '+'}
        </div>
      )}
      <div className="node-content">
        <div className="node-label">{data.label}</div>
        {data.childCount > 0 && (
          <div className="node-children-count">
            {expanded ? `(${data.childCount})` : `(+${data.childCount})`}
          </div>
        )}
      </div>
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
  depth?: number; // 添加深度信息
  meta?: { // 添加元数据字段
    totalNodes?: number;
    processedNodes?: number;
    skippedNodes?: number;
    maxDepthReached?: boolean;
  };
}

// 自定义节点数据接口
interface CustomNodeData {
  label: string;
  level: number;
  childCount?: number; // 子节点数量
  isCollapsed?: boolean; // 节点是否折叠
  hasHiddenChildren?: boolean; // 是否有隐藏子节点
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
  batchSize?: number; // 每批加载的节点数
  maxInitialNodes?: number; // 初始加载的最大节点数
  onMapStats?: (stats: any) => void; // 地图统计回调
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
  direction: 'horizontal' | 'vertical' = 'horizontal',
  visibleNodes: Set<string> = new Set(), // 当前可见节点集合
  maxVisibleDepth: number = 5, // 默认最大显示深度
  collapsedNodes: Set<string> = new Set() // 已折叠的节点集合
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
    
    // 超过最大可见深度的节点不处理
    const isVisible = level <= maxVisibleDepth && !collapsedNodes.has(parentId || '');
    if (!isVisible) {
      return id; // 返回ID但不创建节点
    }
    
    // 将此节点标记为可见
    visibleNodes.add(id);
    
    // 计算子节点数量，含隐藏子节点
    const childCount = node.children ? node.children.length : 0;
    const hasExpandableChildren = childCount > 0;
    const isCollapsed = collapsedNodes.has(id);
    
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
      position: { x: 0, y: 0 },
      data: { 
        label, 
        level,
        childCount,
        isCollapsed,
        hasHiddenChildren: hasExpandableChildren,
        style: { ...nodeStyle, ...(node.style || {}) }
      },
      type: 'custom',
      sourcePosition: direction === 'horizontal' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'horizontal' ? Position.Left : Position.Top,
    };
    
    nodes.push(rfNode);
    
    // 处理子节点 (仅当节点未折叠时)
    if (node.children && Array.isArray(node.children) && node.children.length > 0 && !isCollapsed) {
      node.children.forEach((child: any) => {
        // 递归处理子节点
        const childId = processNode(child, id, level + 1);
        
        if (childId && visibleNodes.has(childId)) {
          // 创建连接边
          const edge: Edge = {
            id: `e-${id}-${childId}`,
            source: id,
            target: childId,
            type: 'smoothstep', // 使用平滑曲线连接，更美观
            animated: false,
            style: { 
              stroke: themeColors.edge, 
              strokeWidth: 2, 
              opacity: 1
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
  batchSize = 500, // 每批加载的节点数
  maxInitialNodes = 1000, // 初始加载的最大节点数
  onMapStats
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentDirection, setCurrentDirection] = useState<'horizontal' | 'vertical'>(direction);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStats, setMapStats] = useState<any>({
    totalNodes: 0,
    visibleNodes: 0,
    hiddenNodes: 0,
    maxDepth: 0,
    loadedDepth: 0
  });
  
  // 追踪当前可见的节点集合
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  
  // 追踪已折叠的节点集合
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  
  // 最大加载深度，初始小一些，用户可以展开更多
  const [maxVisibleDepth, setMaxVisibleDepth] = useState(3);
  
  // 引用React Flow包装器元素
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // React Flow实例
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // 设置主题颜色
  const themeColors = useMemo(() => getThemeColors(theme), [theme]);
  
  // 检测是否为客户端
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 节点类型映射
  const nodeTypes = useMemo(() => ({
    custom: CustomNode
  }), []);
  
  // 监听节点折叠/展开事件
  useEffect(() => {
    const handleNodeToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { id, expanded } = customEvent.detail;
      
      setCollapsedNodes(prev => {
        const newSet = new Set(prev);
        if (expanded) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
      
      // 重新加载数据
      setTimeout(() => refreshLayout(), 0);
    };
    
    window.addEventListener('node:toggle', handleNodeToggle);
    return () => window.removeEventListener('node:toggle', handleNodeToggle);
  }, [data, themeColors]);
  
  // 初始化节点和边缘
  useEffect(() => {
    if (!isClient) return;
    
    try {
      setLoading(true);
      console.log('ReactFlowMap: 处理思维导图数据...');
      
      // 计算数据的总节点数和深度
      const calculateStats = (node: any, depth = 0, stats = { count: 0, maxDepth: 0, skippedNodes: 0 }) => {
        if (!node) return stats;
        
        stats.count++;
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => calculateStats(child, depth + 1, stats));
        }
        
        return stats;
      };
      
      // 获取思维导图元数据或计算统计信息
      let dataStats;
      if (data.meta && data.meta.totalNodes) {
        dataStats = {
          count: data.meta.totalNodes || 0,
          maxDepth: data.meta.maxDepth || 0,
          skippedNodes: data.meta.skippedNodes || 0
        };
      } else {
        const rootNode = data.nodeData || data;
        dataStats = calculateStats(rootNode);
      }
      
      // 更新地图统计信息
      const newStats = {
        totalNodes: dataStats.count,
        visibleNodes: 0,
        hiddenNodes: dataStats.count,
        maxDepth: dataStats.maxDepth,
        loadedDepth: maxVisibleDepth,
        skippedNodes: dataStats.skippedNodes || 0
      };
      
      setMapStats(newStats);
      if (onMapStats) onMapStats(newStats);
      
      console.log(`ReactFlowMap: 思维导图统计信息 - 总节点: ${newStats.totalNodes}, 最大深度: ${newStats.maxDepth}`);
      
      // 设置合适的初始深度
      const initialDepth = dataStats.count > maxInitialNodes ? 2 : 3;
      setMaxVisibleDepth(initialDepth);
      
      // 将数据转换为ReactFlow格式
      const visibleNodesSet = new Set<string>();
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(
        data, 
        themeColors, 
        direction, 
        visibleNodesSet, 
        initialDepth, 
        collapsedNodes
      );
      
      // 更新可见节点集合
      setVisibleNodes(visibleNodesSet);
      
      // 更新统计信息
      newStats.visibleNodes = flowNodes.length;
      newStats.hiddenNodes = newStats.totalNodes - flowNodes.length;
      setMapStats(newStats);
      if (onMapStats) onMapStats(newStats);
      
      // 设置节点和边缘
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      console.log(`ReactFlowMap: 思维导图数据处理完成，显示节点数: ${flowNodes.length}/${newStats.totalNodes}`);
      setLoading(false);
    } catch (err) {
      console.error('ReactFlowMap: 初始化思维导图出错:', err);
      setError('初始化思维导图时出错，请检查数据格式');
      setLoading(false);
    }
  }, [data, isClient, themeColors, direction, maxInitialNodes, onMapStats]);
  
  // 刷新布局
  const refreshLayout = useCallback(() => {
    try {
      setLoading(true);
      console.log('ReactFlowMap: 刷新布局...');
      
      const visibleNodesSet = new Set<string>();
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(
        data, 
        themeColors, 
        currentDirection, 
        visibleNodesSet, 
        maxVisibleDepth, 
        collapsedNodes
      );
      
      // 更新可见节点集合
      setVisibleNodes(visibleNodesSet);
      
      // 更新统计信息
      const newStats = {
        ...mapStats,
        visibleNodes: flowNodes.length,
        hiddenNodes: mapStats.totalNodes - flowNodes.length,
        loadedDepth: maxVisibleDepth
      };
      setMapStats(newStats);
      if (onMapStats) onMapStats(newStats);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      console.log(`ReactFlowMap: 布局刷新完成，显示节点数: ${flowNodes.length}/${mapStats.totalNodes}`);
      setLoading(false);
    } catch (err) {
      console.error('ReactFlowMap: 刷新布局出错:', err);
      setError('刷新布局时出错，请检查数据格式');
      setLoading(false);
    }
  }, [data, themeColors, currentDirection, collapsedNodes, maxVisibleDepth, mapStats, onMapStats]);

  // 加载更多层级
  const loadMoreLevels = useCallback(() => {
    if (maxVisibleDepth < mapStats.maxDepth) {
      setMaxVisibleDepth(prev => prev + 1);
      setTimeout(() => refreshLayout(), 0);
    }
  }, [maxVisibleDepth, mapStats.maxDepth, refreshLayout]);
  
  // 减少可见层级
  const reduceLevels = useCallback(() => {
    if (maxVisibleDepth > 1) {
      setMaxVisibleDepth(prev => prev - 1);
      setTimeout(() => refreshLayout(), 0);
    }
  }, [maxVisibleDepth, refreshLayout]);
  
  // 折叠所有节点
  const collapseAll = useCallback(() => {
    // 收集所有节点ID
    const allIds = nodes.map(node => node.id);
    setCollapsedNodes(new Set(allIds));
    setTimeout(() => refreshLayout(), 0);
  }, [nodes, refreshLayout]);
  
  // 展开所有节点
  const expandAll = useCallback(() => {
    setCollapsedNodes(new Set());
    setTimeout(() => refreshLayout(), 0);
  }, [refreshLayout]);
  
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
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
          <div className="text-gray-700 mb-2 font-medium">加载中...</div>
          <div className="loader"></div>
          <div className="text-sm text-gray-600 mt-2">
            正在处理思维导图数据，请稍候...
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
              onInit={setReactFlowInstance}
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
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={refreshLayout}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    重新布局
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={loadMoreLevels}
                      disabled={maxVisibleDepth >= mapStats.maxDepth}
                      className={`px-3 py-1 text-white rounded text-sm ${
                        maxVisibleDepth >= mapStats.maxDepth ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      加载更多层级
                    </button>
                    <button
                      onClick={reduceLevels}
                      disabled={maxVisibleDepth <= 1}
                      className={`px-3 py-1 text-white rounded text-sm ${
                        maxVisibleDepth <= 1 ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      减少层级
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={expandAll}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      展开全部
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm"
                    >
                      折叠全部
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-2">
                    <div>总节点: {mapStats.totalNodes}</div>
                    <div>显示节点: {mapStats.visibleNodes}</div>
                    <div>隐藏节点: {mapStats.hiddenNodes}</div>
                    <div>当前深度: {maxVisibleDepth}/{mapStats.maxDepth}</div>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}
      
      <style jsx>{`
        .loader {
          border: 5px solid #f3f3f3;
          border-radius: 50%;
          border-top: 5px solid #3498db;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReactFlowMap; 